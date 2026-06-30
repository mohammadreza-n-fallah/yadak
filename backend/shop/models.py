from decimal import Decimal

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from vehicles.models import VehicleBrand, VehicleModel, VehicleTrim
from accounts.models import User


class Category(models.Model):
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children', verbose_name='دسته والد')
    name = models.CharField('نام', max_length=200)
    slug = models.SlugField('اسلاگ', unique=True, allow_unicode=True)
    image = models.ImageField('تصویر', upload_to='categories/', null=True, blank=True)
    description = models.TextField('توضیحات', blank=True)
    is_active = models.BooleanField('فعال', default=True)
    order = models.PositiveIntegerField('ترتیب', default=0)

    class Meta:
        verbose_name = 'دسته‌بندی'
        verbose_name_plural = 'دسته‌بندی‌ها'
        ordering = ['order', 'name']

    def __str__(self):
        if self.parent:
            return f'{self.parent.name} > {self.name}'
        return self.name


class Brand(models.Model):
    name = models.CharField('نام برند', max_length=100)
    slug = models.SlugField('اسلاگ', unique=True, allow_unicode=True)
    logo = models.ImageField('لوگو', upload_to='brands/', null=True, blank=True)
    description = models.TextField('توضیحات', blank=True)
    is_active = models.BooleanField('فعال', default=True)
    order = models.PositiveIntegerField('ترتیب', default=0)

    class Meta:
        verbose_name = 'برند محصول'
        verbose_name_plural = 'برندهای محصول'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Product(models.Model):
    BADGE_CHOICES = [
        ('', 'بدون برچسب'),
        ('new', 'جدید'),
        ('sale', 'حراج'),
        ('original', 'اصلی'),
        ('hot', 'پرفروش'),
    ]

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products', verbose_name='دسته‌بندی')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products', verbose_name='برند')
    name = models.CharField('نام محصول', max_length=300)
    slug = models.SlugField('اسلاگ', unique=True, allow_unicode=True)
    part_number = models.CharField('شماره قطعه', max_length=100, blank=True)
    description = models.TextField('توضیحات', blank=True)
    short_description = models.TextField('توضیح کوتاه', blank=True)
    price = models.DecimalField('قیمت (ریال)', max_digits=14, decimal_places=0, validators=[MinValueValidator(Decimal('0'))])
    sale_price = models.DecimalField('قیمت حراج (ریال)', max_digits=14, decimal_places=0, null=True, blank=True, validators=[MinValueValidator(Decimal('0'))])
    stock = models.PositiveIntegerField('موجودی', default=0)
    badge = models.CharField('برچسب', max_length=20, choices=BADGE_CHOICES, blank=True)
    is_active = models.BooleanField('فعال', default=True)
    is_featured = models.BooleanField('ویژه', default=False)
    weight = models.DecimalField('وزن (کیلوگرم)', max_digits=8, decimal_places=3, null=True, blank=True)
    created_at = models.DateTimeField('تاریخ ایجاد', auto_now_add=True)
    updated_at = models.DateTimeField('تاریخ بروزرسانی', auto_now=True)

    # Vehicle compatibility
    compatible_vehicles = models.ManyToManyField(
        VehicleTrim,
        blank=True,
        related_name='compatible_products',
        verbose_name='خودروهای سازگار',
    )

    class Meta:
        verbose_name = 'محصول'
        verbose_name_plural = 'محصولات'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def effective_price(self):
        return self.sale_price if self.sale_price else self.price

    @property
    def discount_percent(self):
        if self.sale_price and self.price > 0:
            return int((1 - self.sale_price / self.price) * 100)
        return 0

    @property
    def is_in_stock(self):
        return self.stock > 0

    @property
    def average_rating(self):
        reviews = self.reviews.filter(is_approved=True)
        if reviews.exists():
            return round(reviews.aggregate(models.Avg('rating'))['rating__avg'], 1)
        return 0

    @property
    def review_count(self):
        return self.reviews.filter(is_approved=True).count()

    @property
    def main_image(self):
        img = self.images.filter(is_main=True).first()
        if not img:
            img = self.images.first()
        return img


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', verbose_name='محصول')
    image = models.ImageField('تصویر', upload_to='products/')
    alt = models.CharField('متن جایگزین', max_length=200, blank=True)
    is_main = models.BooleanField('تصویر اصلی', default=False)
    order = models.PositiveIntegerField('ترتیب', default=0)

    class Meta:
        verbose_name = 'تصویر محصول'
        verbose_name_plural = 'تصاویر محصول'
        ordering = ['-is_main', 'order']

    def __str__(self):
        return f'{self.product.name} - تصویر {self.pk}'


class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', verbose_name='محصول')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews', verbose_name='کاربر')
    rating = models.PositiveSmallIntegerField('امتیاز', validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField('عنوان', max_length=200, blank=True)
    body = models.TextField('متن نقد')
    is_approved = models.BooleanField('تایید شده', default=False)
    created_at = models.DateTimeField('تاریخ ثبت', auto_now_add=True)

    class Meta:
        verbose_name = 'نقد و بررسی'
        verbose_name_plural = 'نقد و بررسی‌ها'
        ordering = ['-created_at']
        unique_together = ('product', 'user')

    def __str__(self):
        return f'{self.user.username} - {self.product.name} ({self.rating}/5)'


class Wishlist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist', verbose_name='کاربر')
    products = models.ManyToManyField(Product, blank=True, related_name='wishlisted_by', verbose_name='محصولات')
    updated_at = models.DateTimeField('آخرین بروزرسانی', auto_now=True)

    class Meta:
        verbose_name = 'لیست علاقه‌مندی'
        verbose_name_plural = 'لیست‌های علاقه‌مندی'

    def __str__(self):
        return f'لیست علاقه‌مندی {self.user.username}'


class Banner(models.Model):
    POSITION_CHOICES = [
        ('hero', 'هدر اصلی'),
        ('sidebar', 'کنار'),
        ('promo', 'تبلیغاتی'),
        ('footer', 'فوتر'),
    ]

    title = models.CharField('عنوان', max_length=200)
    subtitle = models.CharField('زیر عنوان', max_length=200, blank=True)
    image = models.ImageField('تصویر', upload_to='banners/')
    link = models.CharField('لینک', max_length=500, blank=True)
    position = models.CharField('موقعیت', max_length=20, choices=POSITION_CHOICES, default='hero')
    is_active = models.BooleanField('فعال', default=True)
    order = models.PositiveIntegerField('ترتیب', default=0)

    class Meta:
        verbose_name = 'بنر'
        verbose_name_plural = 'بنرها'
        ordering = ['order']

    def __str__(self):
        return self.title
