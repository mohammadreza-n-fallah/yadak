from rest_framework import serializers
from .models import Call, CallTurn, CallbackRequest


class CallTurnSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CallTurn
        fields = ('role', 'role_display', 'text', 'created_at')


class CallListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    turn_count = serializers.IntegerField(read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Call
        fields = (
            'id', 'session_key', 'caller_name', 'caller_phone', 'status', 'status_display',
            'ai_powered', 'rating', 'turn_count', 'user_name',
            'started_at', 'ended_at', 'duration_seconds',
        )

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return ''


class CallDetailSerializer(CallListSerializer):
    turns = CallTurnSerializer(many=True, read_only=True)

    class Meta(CallListSerializer.Meta):
        fields = CallListSerializer.Meta.fields + ('summary', 'staff_note', 'turns')


class CallAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Call
        fields = ('status', 'staff_note')


class CallbackRequestSerializer(serializers.ModelSerializer):
    """Public create serializer."""
    session_key = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CallbackRequest
        fields = ('name', 'phone', 'topic', 'message', 'session_key')


class AdminCallbackSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    call_id = serializers.IntegerField(source='call.id', read_only=True, default=None)

    class Meta:
        model = CallbackRequest
        fields = (
            'id', 'name', 'phone', 'topic', 'message', 'status', 'status_display',
            'agent_note', 'call_id', 'created_at', 'updated_at',
        )
        read_only_fields = ('name', 'phone', 'topic', 'message', 'created_at', 'updated_at')
