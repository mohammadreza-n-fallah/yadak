from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem, Payment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'product_part_number', 'unit_price', 'quantity', 'subtotal')
    can_delete = False


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ('authority', 'ref_id', 'amount', 'status', 'created_at')
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'shipping_full_name', 'total', 'status', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('order_number', 'shipping_full_name', 'shipping_phone', 'user__username')
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'subtotal', 'total')
    inlines = [OrderItemInline, PaymentInline]
    list_editable = ('status',)
    fieldsets = (
        ('اطلاعات سفارش', {'fields': ('order_number', 'user', 'status', 'payment_status')}),
        ('اطلاعات ارسال', {'fields': ('shipping_full_name', 'shipping_phone', 'shipping_province', 'shipping_city', 'shipping_address', 'shipping_postal_code')}),
        ('مبالغ', {'fields': ('subtotal', 'shipping_cost', 'discount_amount', 'total')}),
        ('سایر', {'fields': ('note', 'tracking_code', 'created_at', 'updated_at')}),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'status', 'ref_id', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('authority', 'ref_id', 'amount', 'created_at')
