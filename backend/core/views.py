from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Newsletter, ContactMessage, SiteSettings
from .serializers import NewsletterSerializer, ContactMessageSerializer, SiteSettingsSerializer


class NewsletterSubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NewsletterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj, created = Newsletter.objects.get_or_create(email=serializer.validated_data['email'])
        if not created:
            if obj.is_active:
                return Response({'message': 'شما قبلاً عضو خبرنامه شده‌اید'})
            obj.is_active = True
            obj.save()
        return Response({'message': 'با موفقیت عضو خبرنامه شدید'}, status=status.HTTP_201_CREATED)


class ContactView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'پیام شما با موفقیت ارسال شد'}, status=status.HTTP_201_CREATED)


class SiteSettingsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
