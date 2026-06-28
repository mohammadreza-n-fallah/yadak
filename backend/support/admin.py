from django.contrib import admin
from django.utils.html import format_html
from .models import ChatSession, ChatMessage, SupportFAQ


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('role', 'content', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'user', 'message_count', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('session_key', 'user__username', 'messages__content')
    readonly_fields = ('session_key', 'user', 'user_agent', 'created_at', 'updated_at')
    inlines = [ChatMessageInline]
    date_hierarchy = 'created_at'

    @admin.display(description='تعداد پیام')
    def message_count(self, obj):
        return obj.messages.count()


@admin.register(SupportFAQ)
class SupportFAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'is_suggested', 'is_active', 'order')
    list_editable = ('is_suggested', 'is_active', 'order')
    list_filter = ('is_active', 'is_suggested')
    search_fields = ('question', 'answer', 'keywords')

    fieldsets = (
        (None, {'fields': ('question', 'answer')}),
        ('تنظیمات', {'fields': ('keywords', 'is_suggested', 'is_active', 'order'),
                     'description': format_html(
                         'کلیدواژه‌ها برای حالت آفلاین (بدون کلید هوش مصنوعی) استفاده می‌شوند.')}),
    )
