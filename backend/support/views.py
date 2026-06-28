import json
import logging
import uuid

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import ai, knowledge
from .models import ChatSession, ChatMessage, SupportFAQ
from .serializers import ChatMessageSerializer, SupportFAQSerializer

logger = logging.getLogger(__name__)

MAX_MESSAGE_LEN = 2000
HISTORY_LIMIT = 20


# ───────────────────────────────────────────────────────────────── helpers ──

def _get_or_create_session(request, session_key):
    session_key = (session_key or '').strip() or uuid.uuid4().hex
    user = request.user if request.user.is_authenticated else None
    session, _ = ChatSession.objects.get_or_create(
        session_key=session_key,
        defaults={'user': user, 'user_agent': request.META.get('HTTP_USER_AGENT', '')[:300]},
    )
    if user and session.user_id != user.id:
        session.user = user
        session.save(update_fields=['user'])
    return session


def _build_history(session):
    msgs = session.messages.order_by('-created_at')[:HISTORY_LIMIT]
    return [{'role': m.role, 'content': m.content} for m in reversed(list(msgs))]


def _clean_message(raw):
    text = (raw or '').strip()
    return text[:MAX_MESSAGE_LEN]


def _sse(payload):
    return f'data: {json.dumps(payload, ensure_ascii=False)}\n\n'


# ─────────────────────────────────────────────────────────────────── views ──

class SupportConfigView(APIView):
    """Bootstraps the widget: greeting, quick replies, and whether live AI is on."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        bot_name = getattr(settings, 'SUPPORT_BOT_NAME', 'دستیار هوشمند')
        return Response({
            'enabled': True,
            'ai_powered': ai.is_enabled(),
            'bot_name': bot_name,
            'greeting': f'سلام 👋 من {bot_name} فروشگاه قطعات خودرو هستم. چطور می‌تونم کمکتون کنم؟',
            'suggestions': knowledge.suggested_questions(),
        })


class FAQListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        faqs = SupportFAQ.objects.filter(is_active=True)
        return Response(SupportFAQSerializer(faqs, many=True).data)


class HistoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        session_key = request.query_params.get('session_key', '').strip()
        if not session_key:
            return Response({'messages': []})
        try:
            session = ChatSession.objects.get(session_key=session_key)
        except ChatSession.DoesNotExist:
            return Response({'messages': []})
        data = ChatMessageSerializer(session.messages.all(), many=True).data
        return Response({'session_key': session_key, 'messages': data})


class ChatView(APIView):
    """Non-streaming reply. Reliable fallback used if streaming is unavailable."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = _clean_message(request.data.get('message'))
        if not message:
            return Response({'detail': 'متن پیام خالی است.'}, status=status.HTTP_400_BAD_REQUEST)

        session = _get_or_create_session(request, request.data.get('session_key'))
        ChatMessage.objects.create(session=session, role='user', content=message)
        history = _build_history(session)

        reply = None
        if ai.is_enabled():
            try:
                reply = ai.chat(history)
            except Exception as exc:
                logger.warning('AI chat failed, using offline fallback: %s', exc)
        if not reply:
            reply = knowledge.offline_reply(message)

        ChatMessage.objects.create(session=session, role='assistant', content=reply)
        return Response({
            'session_key': session.session_key,
            'reply': reply,
            'ai_powered': ai.is_enabled(),
        })


class ChatStreamView(APIView):
    """Server-Sent-Events streaming reply with live token output."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = _clean_message(request.data.get('message'))
        if not message:
            return Response({'detail': 'متن پیام خالی است.'}, status=status.HTTP_400_BAD_REQUEST)

        session = _get_or_create_session(request, request.data.get('session_key'))
        ChatMessage.objects.create(session=session, role='user', content=message)
        history = _build_history(session)

        def event_stream():
            yield _sse({'type': 'start', 'session_key': session.session_key})
            collected = []
            try:
                if ai.is_enabled():
                    for chunk in ai.chat_stream(history):
                        collected.append(chunk)
                        yield _sse({'type': 'delta', 'content': chunk})
                if not collected:
                    # No AI key, or AI yielded nothing → offline fallback.
                    reply = knowledge.offline_reply(message)
                    collected.append(reply)
                    yield _sse({'type': 'delta', 'content': reply})
            except Exception as exc:
                logger.warning('AI stream failed: %s', exc)
                if not collected:
                    reply = knowledge.offline_reply(message)
                    collected.append(reply)
                    yield _sse({'type': 'delta', 'content': reply})

            full = ''.join(collected).strip()
            if full:
                ChatMessage.objects.create(session=session, role='assistant', content=full)
            yield _sse({'type': 'done', 'session_key': session.session_key})

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # disable proxy buffering (nginx)
        return response
