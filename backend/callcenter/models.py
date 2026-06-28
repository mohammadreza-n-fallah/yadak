from django.db import models
from django.conf import settings


class Call(models.Model):
    """A voice call session between a visitor and the AI call-center agent."""
    STATUS_CHOICES = [
        ('active', 'در حال انجام'),
        ('completed', 'پایان‌یافته'),
        ('callback', 'درخواست تماس مجدد'),
        ('missed', 'بی‌پاسخ'),
    ]
    session_key = models.CharField('کلید نشست', max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='calls', verbose_name='کاربر',
    )
    caller_name = models.CharField('نام تماس‌گیرنده', max_length=120, blank=True)
    caller_phone = models.CharField('شماره تماس', max_length=20, blank=True)
    status = models.CharField('وضعیت', max_length=20, choices=STATUS_CHOICES, default='active')
    ai_powered = models.BooleanField('پاسخ با هوش مصنوعی', default=False)
    summary = models.TextField('خلاصه', blank=True)
    staff_note = models.TextField('یادداشت کارشناس', blank=True)
    rating = models.PositiveSmallIntegerField('امتیاز مشتری', null=True, blank=True)
    started_at = models.DateTimeField('شروع تماس', auto_now_add=True)
    ended_at = models.DateTimeField('پایان تماس', null=True, blank=True)
    duration_seconds = models.PositiveIntegerField('مدت (ثانیه)', default=0)

    class Meta:
        verbose_name = 'تماس'
        verbose_name_plural = 'تماس‌ها'
        ordering = ['-started_at']

    def __str__(self):
        who = self.caller_name or (self.user.username if self.user else self.session_key[:8])
        return f'تماس {who} ({self.started_at:%Y-%m-%d %H:%M})'

    @property
    def turn_count(self):
        return self.turns.count()


class CallTurn(models.Model):
    ROLE_CHOICES = [
        ('caller', 'مشتری'),
        ('agent', 'دستیار'),
    ]
    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name='turns', verbose_name='تماس')
    role = models.CharField('گوینده', max_length=10, choices=ROLE_CHOICES)
    text = models.TextField('متن')
    created_at = models.DateTimeField('زمان', auto_now_add=True)

    class Meta:
        verbose_name = 'بخش گفتگو'
        verbose_name_plural = 'متن گفتگوی تماس'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.get_role_display()}: {self.text[:40]}'


class CallbackRequest(models.Model):
    """A request from a visitor to be called back by a human operator."""
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('in_progress', 'در حال پیگیری'),
        ('done', 'انجام شد'),
        ('canceled', 'لغو شد'),
    ]
    call = models.ForeignKey(
        Call, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='callbacks', verbose_name='تماس مرتبط',
    )
    name = models.CharField('نام', max_length=120)
    phone = models.CharField('شماره تماس', max_length=20)
    topic = models.CharField('موضوع', max_length=200, blank=True)
    message = models.TextField('توضیحات', blank=True)
    status = models.CharField('وضعیت', max_length=20, choices=STATUS_CHOICES, default='pending')
    agent_note = models.TextField('یادداشت کارشناس', blank=True)
    created_at = models.DateTimeField('تاریخ ثبت', auto_now_add=True)
    updated_at = models.DateTimeField('بروزرسانی', auto_now=True)

    class Meta:
        verbose_name = 'درخواست تماس مجدد'
        verbose_name_plural = 'درخواست‌های تماس مجدد'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.phone} ({self.get_status_display()})'
