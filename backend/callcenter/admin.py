from django.contrib import admin
from .models import Call, CallTurn, CallbackRequest


class CallTurnInline(admin.TabularInline):
    model = CallTurn
    extra = 0
    readonly_fields = ('role', 'text', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'caller_phone', 'status', 'ai_powered', 'turn_count', 'duration_seconds', 'started_at')
    list_filter = ('status', 'ai_powered', 'started_at')
    search_fields = ('caller_name', 'caller_phone', 'session_key', 'turns__text')
    readonly_fields = ('session_key', 'user', 'ai_powered', 'started_at', 'ended_at', 'duration_seconds', 'turn_count')
    inlines = [CallTurnInline]
    date_hierarchy = 'started_at'

    @admin.display(description='تعداد گفتگو')
    def turn_count(self, obj):
        return obj.turn_count


@admin.register(CallbackRequest)
class CallbackRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'topic', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    list_editable = ('status',)
    search_fields = ('name', 'phone', 'topic', 'message')
    readonly_fields = ('call', 'created_at', 'updated_at')
