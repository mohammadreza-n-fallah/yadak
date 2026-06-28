from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, Payment
from shop.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__('shop.models', fromlist=['Product']).Product.objects.filter(is_active=True),
        write_only=True,
        source='product',
    )
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity', 'subtotal')


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total_price', 'total_items')


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('id', 'product_name', 'product_part_number', 'unit_price', 'quantity', 'subtotal')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'status', 'status_display',
            'payment_status', 'payment_status_display',
            'shipping_full_name', 'shipping_phone',
            'shipping_province', 'shipping_city', 'shipping_address', 'shipping_postal_code',
            'subtotal', 'shipping_cost', 'discount_amount', 'total',
            'note', 'tracking_code', 'created_at', 'items',
        )
        read_only_fields = (
            'id', 'order_number', 'status', 'payment_status',
            'subtotal', 'shipping_cost', 'total', 'tracking_code', 'created_at',
        )


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(required=False)
    full_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=15, required=False)
    province = serializers.CharField(max_length=100, required=False)
    city = serializers.CharField(max_length=100, required=False)
    address = serializers.CharField(required=False)
    postal_code = serializers.CharField(max_length=10, required=False)
    note = serializers.CharField(required=False, allow_blank=True)


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('id', 'authority', 'ref_id', 'amount', 'status', 'created_at')
