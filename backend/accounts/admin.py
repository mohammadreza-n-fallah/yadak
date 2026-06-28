from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone', 'is_staff', 'date_joined')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('اطلاعات اضافی', {'fields': ('phone', 'birth_date', 'avatar')}),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'city', 'province', 'is_default')
    list_filter = ('province', 'is_default')
    search_fields = ('user__username', 'full_name', 'city', 'address')
