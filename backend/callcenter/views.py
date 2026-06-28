import logging
import uuid

from django.conf import settings
from django.db.models import Avg
from django.utils import timezone
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView

from support import ai, knowledge
from .models import Call, CallTurn, CallbackRequest
from .serializers import (
    CallListSerializer, CallDetailSerializer, CallAdminUpdateSerializer,
    CallbackRequestSerializer, AdminCallbackSerializer,
)

logger = logging.getLogger(__name__)

MAX_TURN_LEN = 2000
HISTORY_LIMIT = 24


class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


def _voice_prompt():
    return knowledge.build_system_prompt(voice=True)


def _history(call):
    turns = call.turns.order_by('-created_at')[:HISTORY_LIMIT]
    return [
        {'role': 'user' if t.role == 'caller' else 'assistant', 'content': t.text}
        for t in reversed(list(turns))
    ]


# ─────────────────────────────────────────────────────────── public (caller) ──

class CallStartView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_key = (request.data.get('session_key') or '').strip() or uuid.uuid4().hex
        user = request.user if request.user.is_authenticated else None
        call, created = Call.objects.get_or_create(
            session_key=session_key,
            defaults={'user': user, 'ai_powered': ai.is_enabled(), 'status': 'active'},
        )
        if not created and call.status != 'active':
            # Reuse the key but begin a fresh active call.
            call.status = 'active'
            call.ended_at = None
            call.ai_powered = ai.is_enabled()
            call.save(update_fields=['status', 'ended_at', 'ai_powered'])

        name = (request.data.get('caller_name') or '').strip()
        phone = (request.data.get('caller_phone') or '').strip()
        if name or phone or user:
            call.caller_name = name or call.caller_name
            call.caller_phone = phone or call.caller_phone
            if user and not call.user_id:
                call.user = user
            call.save(update_fields=['caller_name', 'caller_phone', 'user'])

        bot_name = getattr(settings, 'SUPPORT_BOT_NAME', 'دستیار هوشمند')
        greeting = (
            f'سلام، به پشتیبانی صوتی فروشگاه قطعات خودرو خوش آمدید. '
            f'من {bot_name} هستم. بفرمایید چه کمکی می‌تونم بکنم؟'
        )
        if created or not call.turns.exists():
            CallTurn.objects.create(call=call, role='agent', text=greeting)

        return Response({
            'call_id': call.id,
            'session_key': session_key,
            'greeting': greeting,
            'ai_powered': ai.is_enabled(),
        })


class CallTurnView(APIView):
    """Caller says something → AI agent replies (voice persona)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        text = (request.data.get('text') or '').strip()[:MAX_TURN_LEN]
        session_key = (request.data.get('session_key') or '').strip()
        if not text:
            return Response({'detail': 'متن خالی است.'}, status=status.HTTP_400_BAD_REQUEST)
        if not session_key:
            return Response({'detail': 'session_key لازم است.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user.is_authenticated else None
        call, _ = Call.objects.get_or_create(
            session_key=session_key,
            defaults={'user': user, 'ai_powered': ai.is_enabled(), 'status': 'active'},
        )
        CallTurn.objects.create(call=call, role='caller', text=text)

        reply = None
        if ai.is_enabled():
            try:
                reply = ai.chat(_history(call), system_prompt=_voice_prompt())
            except Exception as exc:
                logger.warning('Call AI failed, offline fallback: %s', exc)
        if not reply:
            reply = knowledge.offline_reply(text, voice=True)

        CallTurn.objects.create(call=call, role='agent', text=reply)
        return Response({'reply': reply, 'ai_powered': ai.is_enabled()})


class CallEndView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_key = (request.data.get('session_key') or '').strip()
        try:
            call = Call.objects.get(session_key=session_key)
        except Call.DoesNotExist:
            return Response({'detail': 'تماس یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)

        call.status = 'completed'
        call.ended_at = timezone.now()
        try:
            call.duration_seconds = int(request.data.get('duration_seconds') or 0)
        except (TypeError, ValueError):
            call.duration_seconds = 0
        rating = request.data.get('rating')
        if rating not in (None, ''):
            try:
                call.rating = max(1, min(5, int(rating)))
            except (TypeError, ValueError):
                pass
        if not call.summary:
            first = call.turns.filter(role='caller').first()
            if first:
                call.summary = first.text[:200]
        call.save()
        return Response({'ok': True})


class CallbackRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CallbackRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_key = (serializer.validated_data.pop('session_key', '') or '').strip()
        call = Call.objects.filter(session_key=session_key).first() if session_key else None
        CallbackRequest.objects.create(call=call, **serializer.validated_data)
        if call and call.status == 'active':
            call.status = 'callback'
            call.save(update_fields=['status'])
        return Response(
            {'message': 'درخواست تماس شما ثبت شد. کارشناسان ما به‌زودی با شما تماس می‌گیرند.'},
            status=status.HTTP_201_CREATED,
        )


# ──────────────────────────────────────────────────────────────── staff side ──

class CallCenterStatsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        completed = Call.objects.filter(status='completed')
        return Response({
            'active_calls': Call.objects.filter(status='active').count(),
            'calls_today': Call.objects.filter(started_at__gte=today).count(),
            'total_calls': Call.objects.count(),
            'pending_callbacks': CallbackRequest.objects.filter(status='pending').count(),
            'avg_duration': int(completed.aggregate(a=Avg('duration_seconds'))['a'] or 0),
        })


class AdminCallListView(generics.ListAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = CallListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['caller_name', 'caller_phone', 'session_key', 'turns__text']
    ordering_fields = ['started_at', 'duration_seconds']

    def get_queryset(self):
        qs = Call.objects.all()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs.distinct()


class AdminCallDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsStaffUser]
    queryset = Call.objects.all()

    def get_serializer_class(self):
        return CallAdminUpdateSerializer if self.request.method in ('PATCH', 'PUT') else CallDetailSerializer


class AdminCallbackListView(generics.ListAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = AdminCallbackSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'topic']

    def get_queryset(self):
        qs = CallbackRequest.objects.all()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminCallbackDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsStaffUser]
    queryset = CallbackRequest.objects.all()
    serializer_class = AdminCallbackSerializer
