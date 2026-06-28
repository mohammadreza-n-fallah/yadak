import uuid
from django.db import models
from accounts.models import User, Address
from shop.models import Product


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='cart', verbose_name='کاربر')
    session_key = models.CharField('کلید جلسه', max_length=40, blank=True)
    created_at = models.DateTimeField('تاریخ ایجاد', auto_now_add=True)
    updated_at = models.DateTimeField('بروزرسانی', auto_now=True)

    class Meta:
        verbose_name = 'سبد خرید'
        verbose_name_plural = 'سبدهای خرید'

    def __str__(self):
        return f'سبد خرید {self.user or self.session_key}'

    @property
    def total_price(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', verbose_name='سبد خرید')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='محصول')
    quantity = models.PositiveIntegerField('تعداد', default=1)
    added_at = models.DateTimeField('تاریخ افزودن', auto_now_add=True)

    class Meta:
        verbose_name = 'آیتم سبد'
        verbose_name_plural = 'آیتم‌های سبد'
        unique_together = ('cart', 'product')

    def __str__(self):
        return f'{self.product.name} x {self.quantity}'

    @property
    def subtotal(self):
        return self.product.effective_price * self.quantity


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار پرداخت'),
        ('paid', 'پرداخت شده'),
        ('processing', 'در حال پردازش'),
        ('shipped', 'ارسال شده'),
        ('delivered', 'تحویل داده شده'),
        ('cancelled', 'لغو شده'),
        ('refunded', 'مسترد شده'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'پرداخت نشده'),
        ('paid', 'پرداخت شده'),
        ('failed', 'ناموفق'),
        ('refunded', 'مسترد'),
    ]

    order_number = models.CharField('شماره سفارش', max_length=20, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders', verbose_name='کاربر')
    status = models.CharField('وضعیت', max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField('وضعیت پرداخت', max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')

    # Shipping info (snapshot)
    shipping_full_name = models.CharField('نام گیرنده', max_length=100)
    shipping_phone = models.CharField('تلفن گیرنده', max_length=15)
    shipping_province = models.CharField('استان', max_length=100)
    shipping_city = models.CharField('شهر', max_length=100)
    shipping_address = models.TextField('آدرس')
    shipping_postal_code = models.CharField('کد پستی', max_length=10)

    # Pricing
    subtotal = models.DecimalField('مبلغ کالاها', max_digits=14, decimal_places=0)
    shipping_cost = models.DecimalField('هزینه ارسال', max_digits=10, decimal_places=0, default=0)
    discount_amount = models.DecimalField('مبلغ تخفیف', max_digits=14, decimal_places=0, default=0)
    total = models.DecimalField('مبلغ کل', max_digits=14, decimal_places=0)

    note = models.TextField('یادداشت', blank=True)
    tracking_code = models.CharField('کد رهگیری پست', max_length=50, blank=True)

    created_at = models.DateTimeField('تاریخ ثبت', auto_now_add=True)
    updated_at = models.DateTimeField('بروزرسانی', auto_now=True)

    class Meta:
        verbose_name = 'سفارش'
        verbose_name_plural = 'سفارش‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return f'سفارش #{self.order_number}'

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self._generate_order_number()
        super().save(*args, **kwargs)

    def _generate_order_number(self):
        return f'RP{uuid.uuid4().hex[:8].upper()}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name='سفارش')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, verbose_name='محصول')
    product_name = models.CharField('نام محصول', max_length=300)
    product_part_number = models.CharField('شماره قطعه', max_length=100, blank=True)
    unit_price = models.DecimalField('قیمت واحد', max_digits=14, decimal_places=0)
    quantity = models.PositiveIntegerField('تعداد')
    subtotal = models.DecimalField('مبلغ', max_digits=14, decimal_places=0)

    class Meta:
        verbose_name = 'آیتم سفارش'
        verbose_name_plural = 'آیتم‌های سفارش'

    def __str__(self):
        return f'{self.product_name} x {self.quantity}'


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('success', 'موفق'),
        ('failed', 'ناموفق'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments', verbose_name='سفارش')
    authority = models.CharField('کد پیگیری زرین‌پال', max_length=50, blank=True)
    ref_id = models.CharField('شماره مرجع', max_length=50, blank=True)
    amount = models.DecimalField('مبلغ (ریال)', max_digits=14, decimal_places=0)
    status = models.CharField('وضعیت', max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField('تاریخ', auto_now_add=True)

    class Meta:
        verbose_name = 'پرداخت'
        verbose_name_plural = 'پرداخت‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return f'پرداخت {self.amount} ریال - {self.get_status_display()}'
