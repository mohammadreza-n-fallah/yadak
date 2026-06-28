from django.contrib import admin
from .models import Newsletter, ContactMessage, SiteSettings


@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_active', 'subscribed_at')
    list_filter = ('is_active',)
    search_fields = ('email',)
    list_editable = ('is_active',)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'email', 'subject', 'message')
    list_editable = ('status',)
    readonly_fields = ('created_at',)


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ('اطلاعات سایت', {'fields': ('site_name', 'site_logo')}),
        ('اطلاعات تماس', {'fields': ('phone', 'email', 'address', 'working_hours')}),
        ('شبکه‌های اجتماعی', {'fields': ('instagram', 'telegram', 'whatsapp')}),
        ('محتوا', {'fields': ('footer_text',)}),
    )

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
