from django.conf import settings
from django.db import transaction
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from shop.models import Product
from accounts.models import Address
from .models import Cart, CartItem, Order, OrderItem, Payment
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer, CheckoutSerializer
from . import zarinpal


def get_or_create_cart(request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    return cart


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        """Add or update item in cart."""
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        product = get_object_or_404(Product, pk=product_id, is_active=True)

        if quantity < 1:
            return Response({'error': 'تعداد باید حداقل ۱ باشد'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity > product.stock:
            return Response({'error': 'موجودی کافی نیست'}, status=status.HTTP_400_BAD_REQUEST)

        cart = get_or_create_cart(request)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        """Remove item from cart."""
        product_id = request.data.get('product_id')
        cart = get_or_create_cart(request)
        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        return Response(CartSerializer(cart).data)


class CartClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        return Response({'status': 'سبد خرید پاک شد'})


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        cart = get_or_create_cart(request)
        if not cart.items.exists():
            return Response({'error': 'سبد خرید خالی است'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate stock availability before creating order
        cart_items = list(cart.items.select_related('product').all())
        for item in cart_items:
            if item.product.stock < item.quantity:
                return Response(
                    {'error': f'موجودی محصول "{item.product.name}" کافی نیست. موجودی فعلی: {item.product.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Resolve shipping info
        address_id = data.get('address_id')
        if address_id:
            addr = get_object_or_404(Address, pk=address_id, user=request.user)
            ship_name = addr.full_name
            ship_phone = addr.phone
            ship_province = addr.province
            ship_city = addr.city
            ship_address = addr.address
            ship_postal = addr.postal_code
        else:
            ship_name = data.get('full_name', '')
            ship_phone = data.get('phone', '')
            ship_province = data.get('province', '')
            ship_city = data.get('city', '')
            ship_address = data.get('address', '')
            ship_postal = data.get('postal_code', '')

        subtotal = cart.total_price
        shipping_cost = 0  # Free shipping; adjust as needed
        total = subtotal + shipping_cost

        order = Order.objects.create(
            user=request.user,
            shipping_full_name=ship_name,
            shipping_phone=ship_phone,
            shipping_province=ship_province,
            shipping_city=ship_city,
            shipping_address=ship_address,
            shipping_postal_code=ship_postal,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,
            note=data.get('note', ''),
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                product_part_number=item.product.part_number,
                unit_price=item.product.effective_price,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )
        # NOTE: stock is deducted and the cart cleared only once the payment is
        # CONFIRMED (see PaymentVerifyView). Reserving inventory here would leak
        # stock on every abandoned/failed payment and strand the user with an
        # empty cart and no way to retry.

        # Initiate Zarinpal payment
        callback_url = f'{settings.SITE_URL}/api/orders/payment/verify/?order={order.order_number}'
        result = zarinpal.request_payment(
            amount=int(total),
            description=f'پرداخت سفارش #{order.order_number}',
            callback_url=callback_url,
            email=request.user.email,
            mobile=getattr(request.user, 'phone', ''),
        )

        if 'error' in result:
            # Nothing was deducted yet, so simply drop the unpaid order.
            order.delete()
            return Response({'error': f'خطا در اتصال به درگاه پرداخت: {result["error"]}'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        payment = Payment.objects.create(
            order=order,
            authority=result['authority'],
            amount=total,
        )
        return Response({
            'order': OrderSerializer(order).data,
            'pay_url': result['pay_url'],
        })


class PaymentVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def _fail(self, frontend_url, order, payment):
        """Mark the order/payment failed (idempotent) and bounce to the failure page.

        No stock was deducted at checkout, so there is nothing to restore — the
        order is kept and the customer's cart is left intact so they can retry.
        """
        if payment and payment.status != 'failed':
            payment.status = 'failed'
            payment.save(update_fields=['status'])
        if order.payment_status not in ('paid', 'failed'):
            order.payment_status = 'failed'
            order.save(update_fields=['payment_status'])
        return HttpResponseRedirect(
            f'{frontend_url}/payment/verify?status=failed&order_number={order.order_number}'
        )

    def get(self, request):
        frontend_url = settings.FRONTEND_URL
        order_number = request.query_params.get('order')
        authority = request.query_params.get('Authority')
        pay_status = request.query_params.get('Status')

        order = get_object_or_404(Order, order_number=order_number)
        payment = order.payments.filter(authority=authority).first()

        # Idempotency: a repeated callback for an already-paid order is a no-op.
        if order.payment_status == 'paid':
            ref = order.payments.filter(status='success').values_list('ref_id', flat=True).first() or ''
            return HttpResponseRedirect(
                f'{frontend_url}/payment/verify?status=success&ref_id={ref}&order_number={order.order_number}'
            )

        if pay_status != 'OK' or not payment:
            return self._fail(frontend_url, order, payment)

        result = zarinpal.verify_payment(int(payment.amount), authority)
        if 'error' in result:
            return self._fail(frontend_url, order, payment)

        # Payment confirmed → now deduct stock and clear the cart, atomically.
        with transaction.atomic():
            short = []
            for item in order.items.select_related('product'):
                if not item.product_id:
                    continue
                product = Product.objects.select_for_update().get(pk=item.product_id)
                if product.stock >= item.quantity:
                    product.stock -= item.quantity
                else:
                    # Rare race: someone else bought it after checkout. Honour the
                    # paid order, clamp stock to zero, and flag it for staff.
                    short.append(product.name)
                    product.stock = 0
                product.save(update_fields=['stock'])

            if order.user_id:
                cart = Cart.objects.filter(user=order.user).first()
                if cart:
                    cart.items.all().delete()

            payment.ref_id = result['ref_id']
            payment.status = 'success'
            payment.save(update_fields=['ref_id', 'status'])
            order.payment_status = 'paid'
            order.status = 'processing'
            if short:
                flag = 'کسری موجودی هنگام تایید پرداخت: ' + '، '.join(short)
                order.note = f'{order.note} | {flag}' if order.note else flag
            order.save()

        return HttpResponseRedirect(
            f'{frontend_url}/payment/verify?status=success'
            f'&ref_id={result["ref_id"]}&order_number={order.order_number}'
        )


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderTrackView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        order_number = request.query_params.get('order_number')
        phone = request.query_params.get('phone')
        if not order_number or not phone:
            return Response({'error': 'شماره سفارش و شماره موبایل الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
        order = Order.objects.filter(order_number=order_number, shipping_phone=phone).first()
        if not order:
            return Response({'error': 'سفارش یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)
