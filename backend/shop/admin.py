from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Brand, Product, ProductImage, ProductReview, Wishlist, Banner


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'is_active', 'order')
    list_filter = ('is_active', 'parent')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_active', 'order')


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'order')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('is_active', 'order')


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt', 'is_main', 'order')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'price', 'sale_price', 'stock', 'badge', 'is_active', 'is_featured', 'created_at')
    list_filter = ('is_active', 'is_featured', 'badge', 'category', 'brand')
    search_fields = ('name', 'part_number', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('stock', 'is_active', 'is_featured', 'badge')
    filter_horizontal = ('compatible_vehicles',)
    inlines = [ProductImageInline]
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('اطلاعات اصلی', {'fields': ('name', 'slug', 'part_number', 'category', 'brand')}),
        ('قیمت و موجودی', {'fields': ('price', 'sale_price', 'stock', 'badge')}),
        ('توضیحات', {'fields': ('description', 'short_description', 'weight')}),
        ('سازگاری خودرو', {'fields': ('compatible_vehicles',)}),
        ('تنظیمات', {'fields': ('is_active', 'is_featured', 'created_at', 'updated_at')}),
    )


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'rating')
    list_editable = ('is_approved',)
    search_fields = ('product__name', 'user__username', 'body')
    readonly_fields = ('created_at',)


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'order')
    list_editable = ('is_active', 'order')
