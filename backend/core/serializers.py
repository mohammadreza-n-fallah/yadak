from rest_framework import serializers
from .models import Newsletter, ContactMessage, SiteSettings


class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ('email',)


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ('name', 'email', 'phone', 'subject', 'message')


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = ('site_name', 'phone', 'email', 'address', 'working_hours',
                  'instagram', 'telegram', 'whatsapp', 'footer_text')
