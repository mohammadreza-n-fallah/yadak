from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    phone = models.CharField('شماره موبایل', max_length=15, blank=True)
    birth_date = models.DateField('تاریخ تولد', null=True, blank=True)
    avatar = models.ImageField('تصویر پروفایل', upload_to='avatars/', null=True, blank=True)

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'

    def __str__(self):
        return self.get_full_name() or self.username


class Address(models.Model):
    PROVINCE_CHOICES = [
        ('alborz', 'البرز'), ('ardabil', 'اردبیل'), ('isfahan', 'اصفهان'),
        ('ilam', 'ایلام'), ('azerbaijan_east', 'آذربایجان شرقی'),
        ('azerbaijan_west', 'آذربایجان غربی'), ('bushehr', 'بوشهر'),
        ('tehran', 'تهران'), ('chaharmahal', 'چهارمحال و بختیاری'),
        ('south_khorasan', 'خراسان جنوبی'), ('khorasan_razavi', 'خراسان رضوی'),
        ('north_khorasan', 'خراسان شمالی'), ('khuzestan', 'خوزستان'),
        ('zanjan', 'زنجان'), ('semnan', 'سمنان'), ('sistan', 'سیستان و بلوچستان'),
        ('fars', 'فارس'), ('qazvin', 'قزوین'), ('qom', 'قم'),
        ('kurdistan', 'کردستان'), ('kerman', 'کرمان'), ('kermanshah', 'کرمانشاه'),
        ('kohgiluyeh', 'کهگیلویه و بویراحمد'), ('golestan', 'گلستان'),
        ('Gilan', 'گیلان'), ('lorestan', 'لرستان'), ('mazandaran', 'مازندران'),
        ('markazi', 'مرکزی'), ('hormozgan', 'هرمزگان'), ('hamadan', 'همدان'),
        ('yazd', 'یزد'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses', verbose_name='کاربر')
    full_name = models.CharField('نام و نام خانوادگی', max_length=100)
    phone = models.CharField('شماره تماس', max_length=15)
    province = models.CharField('استان', max_length=50, choices=PROVINCE_CHOICES)
    city = models.CharField('شهر', max_length=100)
    address = models.TextField('آدرس')
    postal_code = models.CharField('کد پستی', max_length=10)
    is_default = models.BooleanField('پیش‌فرض', default=False)

    class Meta:
        verbose_name = 'آدرس'
        verbose_name_plural = 'آدرس‌ها'

    def __str__(self):
        return f'{self.full_name} - {self.city}'
