from django.contrib import admin
from .models import Post, PostCategory


@admin.register(PostCategory)
class PostCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'is_published', 'published_at', 'views')
    list_filter = ('is_published', 'category', 'author')
    search_fields = ('title', 'excerpt', 'body')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('is_published',)
    readonly_fields = ('created_at', 'updated_at', 'views')
    fieldsets = (
        ('اطلاعات اصلی', {'fields': ('title', 'slug', 'category', 'author')}),
        ('محتوا', {'fields': ('excerpt', 'body', 'image')}),
        ('انتشار', {'fields': ('is_published', 'published_at')}),
        ('آمار', {'fields': ('views', 'created_at', 'updated_at')}),
    )
