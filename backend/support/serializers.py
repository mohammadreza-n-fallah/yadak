from rest_framework import serializers
from .models import ChatMessage, SupportFAQ


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ('role', 'content', 'created_at')


class SupportFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportFAQ
        fields = ('id', 'question', 'answer')
