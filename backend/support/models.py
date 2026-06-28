from django.db import models
from django.conf import settings


class ChatSession(models.Model):
    """A single visitor conversation. Identified by a client-generated key so
    anonymous visitors keep their history across page loads."""
    session_key = models.CharField('کلید نشست', max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='chat_sessions', verbose_name='کاربر',
    )
    user_agent = models.CharField('مرورگر', max_length=300, blank=True)
    created_at = models.DateTimeField('تاریخ شروع', auto_now_add=True)
    updated_at = models.DateTimeField('آخرین فعالیت', auto_now=True)

    class Meta:
        verbose_name = 'گفتگوی پشتیبانی'
        verbose_name_plural = 'گفتگوهای پشتیبانی'
        ordering = ['-updated_at']

    def __str__(self):
        who = self.user.username if self.user else self.session_key[:8]
        return f'گفتگو {who} ({self.created_at:%Y-%m-%d %H:%M})'


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'کاربر'),
        ('assistant', 'دستیار'),
    ]
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages', verbose_name='نشست')
    role = models.CharField('نقش', max_length=12, choices=ROLE_CHOICES)
    content = models.TextField('متن پیام')
    created_at = models.DateTimeField('تاریخ', auto_now_add=True)

    class Meta:
        verbose_name = 'پیام گفتگو'
        verbose_name_plural = 'پیام‌های گفتگو'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.get_role_display()}: {self.content[:40]}'


class SupportFAQ(models.Model):
    """Knowledge base entries. Used both to ground the LLM and to power the
    offline keyword fallback when no AI key is configured."""
    question = models.CharField('سوال', max_length=300)
    answer = models.TextField('پاسخ')
    keywords = models.CharField(
        'کلیدواژه‌ها', max_length=300, blank=True,
        help_text='کلمات کلیدی جدا شده با ویرگول برای تطبیق در حالت آفلاین',
    )
    order = models.PositiveIntegerField('ترتیب', default=0)
    is_active = models.BooleanField('فعال', default=True)
    is_suggested = models.BooleanField('نمایش به عنوان پیشنهاد سریع', default=False)

    class Meta:
        verbose_name = 'سوال متداول پشتیبانی'
        verbose_name_plural = 'سوالات متداول پشتیبانی'
        ordering = ['order', 'id']

    def __str__(self):
        return self.question
