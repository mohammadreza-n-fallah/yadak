from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Address


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'phone', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'رمزهای عبور مطابقت ندارند.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'birth_date', 'avatar', 'is_staff')
        read_only_fields = ('id', 'username', 'is_staff')


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ('user',)


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Let users sign in with EITHER their username or their email.

    The login form accepts "username or email"; the default SimpleJWT
    serializer only matches the username. If the supplied value looks like an
    email and isn't itself a username, swap in the matching user's username
    before the normal credential check runs.
    """
    def validate(self, attrs):
        login = attrs.get(self.username_field, '')
        if login and '@' in login and not User.objects.filter(username=login).exists():
            match = User.objects.filter(email__iexact=login).order_by('id').first()
            if match:
                attrs[self.username_field] = match.username
        return super().validate(attrs)
