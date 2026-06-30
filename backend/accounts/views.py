import re

import requests
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Address
from .serializers import (
    RegisterSerializer, UserSerializer, AddressSerializer,
    EmailOrUsernameTokenObtainPairSerializer,
)


class LoginView(TokenObtainPairView):
    """JWT login that accepts a username or an email."""
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class GoogleLoginView(APIView):
    """Sign in (or auto-register) with a Google account.

    The frontend obtains a Google ID token via Google Identity Services and
    POSTs it here as ``{"credential": "<id_token>"}``. We verify the token with
    Google, then issue our own JWT pair — identical in shape to the password
    login response — so the rest of the app is unchanged.
    """
    permission_classes = [permissions.AllowAny]

    GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

    def post(self, request):
        credential = request.data.get('credential') or request.data.get('id_token') or ''
        if not credential:
            return Response(
                {'detail': 'توکن گوگل ارسال نشده است'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify the ID token directly with Google (checks signature + expiry).
        try:
            resp = requests.get(
                self.GOOGLE_TOKENINFO_URL,
                params={'id_token': credential},
                timeout=10,
            )
        except requests.RequestException:
            return Response(
                {'detail': 'خطا در ارتباط با گوگل، لطفاً دوباره تلاش کنید'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        if resp.status_code != 200:
            return Response(
                {'detail': 'توکن گوگل نامعتبر یا منقضی شده است'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        info = resp.json()

        # The token must have been issued for *our* client ID.
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if client_id and info.get('aud') != client_id:
            return Response(
                {'detail': 'توکن گوگل برای این برنامه صادر نشده است'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # tokeninfo returns email_verified as the string "true".
        if str(info.get('email_verified', '')).lower() != 'true':
            return Response(
                {'detail': 'ایمیل حساب گوگل تایید نشده است'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = (info.get('email') or '').strip().lower()
        if not email:
            return Response(
                {'detail': 'ایمیل در حساب گوگل یافت نشد'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        created = False
        if user is None:
            user = User(
                username=self._unique_username(email),
                email=email,
                first_name=info.get('given_name', ''),
                last_name=info.get('family_name', ''),
            )
            user.set_unusable_password()  # Google-only account; no password login.
            user.save()
            created = True

        if not user.is_active:
            return Response(
                {'detail': 'این حساب کاربری غیرفعال است'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'created': created,
        })

    @staticmethod
    def _unique_username(email):
        base = re.sub(r'[^a-zA-Z0-9_.]', '', email.split('@')[0]) or 'user'
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f'{base}{suffix}'
            suffix += 1
        return username


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')

        if not current_password or not new_password:
            return Response(
                {'error': 'رمز عبور فعلی و جدید الزامی هستند'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not request.user.check_password(current_password):
            return Response(
                {'current_password': 'رمز عبور فعلی اشتباه است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 8:
            return Response(
                {'new_password': 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد'},
                status=status.HTTP_400_BAD_REQUEST
            )

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'status': 'رمز عبور با موفقیت تغییر یافت'})


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save()
