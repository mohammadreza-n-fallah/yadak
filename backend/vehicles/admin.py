from django.contrib import admin
from .models import VehicleBrand, VehicleModel, VehicleTrim


class VehicleModelInline(admin.TabularInline):
    model = VehicleModel
    extra = 1
    fields = ('name', 'slug', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(VehicleBrand)
class VehicleBrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'order')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_active', 'order')
    inlines = [VehicleModelInline]


class VehicleTrimInline(admin.TabularInline):
    model = VehicleTrim
    extra = 1
    fields = ('name', 'year_from', 'year_to', 'is_active')


@admin.register(VehicleModel)
class VehicleModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'is_active')
    list_filter = ('is_active', 'brand')
    search_fields = ('name', 'brand__name')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [VehicleTrimInline]


@admin.register(VehicleTrim)
class VehicleTrimAdmin(admin.ModelAdmin):
    list_display = ('name', 'model', 'year_from', 'year_to', 'is_active')
    list_filter = ('is_active', 'model__brand')
    search_fields = ('name', 'model__name')
