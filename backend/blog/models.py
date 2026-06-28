from django.db import models
from accounts.models import User


class PostCategory(models.Model):
    name = models.CharField('نام', max_length=100)
    slug = models.SlugField('اسلاگ', unique=True, allow_unicode=True)

    class Meta:
        verbose_name = 'دسته‌بندی وبلاگ'
        verbose_name_plural = 'دسته‌بندی‌های وبلاگ'

    def __str__(self):
        return self.name


class Post(models.Model):
    category = models.ForeignKey(PostCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts', verbose_name='دسته‌بندی')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='posts', verbose_name='نویسنده')
    title = models.CharField('عنوان', max_length=300)
    slug = models.SlugField('اسلاگ', unique=True, allow_unicode=True)
    excerpt = models.TextField('خلاصه', blank=True)
    body = models.TextField('متن', blank=True)
    image = models.ImageField('تصویر شاخص', upload_to='blog/', null=True, blank=True)
    is_published = models.BooleanField('منتشر شده', default=False)
    published_at = models.DateTimeField('تاریخ انتشار', null=True, blank=True)
    created_at = models.DateTimeField('تاریخ ایجاد', auto_now_add=True)
    updated_at = models.DateTimeField('بروزرسانی', auto_now=True)
    views = models.PositiveIntegerField('بازدید', default=0)

    class Meta:
        verbose_name = 'مطلب'
        verbose_name_plural = 'مطالب'
        ordering = ['-published_at']

    def __str__(self):
        return self.title
