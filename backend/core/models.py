from django.db import models


class Newsletter(models.Model):
    email = models.EmailField('ایمیل', unique=True)
    is_active = models.BooleanField('فعال', default=True)
    subscribed_at = models.DateTimeField('تاریخ عضویت', auto_now_add=True)

    class Meta:
        verbose_name = 'خبرنامه'
        verbose_name_plural = 'خبرنامه'

    def __str__(self):
        return self.email


class ContactMessage(models.Model):
    STATUS_CHOICES = [
        ('new', 'جدید'),
        ('read', 'خوانده شده'),
        ('replied', 'پاسخ داده شده'),
    ]

    name = models.CharField('نام', max_length=100)
    email = models.EmailField('ایمیل')
    phone = models.CharField('تلفن', max_length=15, blank=True)
    subject = models.CharField('موضوع', max_length=200)
    message = models.TextField('پیام')
    status = models.CharField('وضعیت', max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField('تاریخ', auto_now_add=True)

    class Meta:
        verbose_name = 'پیام تماس'
        verbose_name_plural = 'پیام‌های تماس'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.subject}'


class SiteSettings(models.Model):
    site_name = models.CharField('نام سایت', max_length=200, default='فروشگاه قطعات خودرو')
    site_logo = models.ImageField('لوگو', upload_to='site/', null=True, blank=True)
    phone = models.CharField('تلفن', max_length=20, blank=True)
    email = models.EmailField('ایمیل', blank=True)
    address = models.TextField('آدرس', blank=True)
    working_hours = models.CharField('ساعات کاری', max_length=200, blank=True)
    instagram = models.URLField('اینستاگرام', blank=True)
    telegram = models.URLField('تلگرام', blank=True)
    whatsapp = models.CharField('واتساپ', max_length=20, blank=True)
    footer_text = models.TextField('متن فوتر', blank=True)

    class Meta:
        verbose_name = 'تنظیمات سایت'
        verbose_name_plural = 'تنظیمات سایت'

    def __str__(self):
        return self.site_name

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
