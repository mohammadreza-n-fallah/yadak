"""Payment lifecycle tests — the critical money/inventory path.

Verifies the deduct-on-confirmation behaviour: stock and the cart are only
touched once Zarinpal confirms the payment, so abandoned/failed payments never
leak inventory or strand the customer.
"""
from unittest import mock

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User
from shop.models import Category, Product
from orders.models import Cart, Order


class PaymentLifecycleTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='buyer', email='b@t.local', password='pw')
        self.cat = Category.objects.create(name='روغن', slug='oil')
        self.product = Product.objects.create(
            name='روغن موتور', slug='motor-oil', category=self.cat,
            price=500000, stock=10, is_active=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def _add_to_cart(self, qty=3):
        r = self.client.post(reverse('cart'), {'product_id': self.product.id, 'quantity': qty}, format='json')
        self.assertEqual(r.status_code, 200, r.content)

    def _checkout(self):
        return self.client.post(reverse('checkout'), {
            'full_name': 'خریدار', 'phone': '09120000000', 'province': 'tehran',
            'city': 'تهران', 'address': 'خ تست', 'postal_code': '1234567890',
        }, format='json')

    def _verify(self, order, authority, pay_status='OK'):
        # PaymentVerifyView is AllowAny and keyed by order_number + authority.
        return APIClient().get(reverse('payment-verify'), {
            'order': order.order_number, 'Authority': authority, 'Status': pay_status,
        })

    @mock.patch('orders.zarinpal.request_payment',
                return_value={'authority': 'AUTH123', 'pay_url': 'https://pay.test/AUTH123'})
    def test_checkout_does_not_touch_stock_or_cart(self, _req):
        self._add_to_cart(3)
        r = self._checkout()
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIn('pay_url', r.json())
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10, 'stock must NOT be deducted at checkout')
        cart = Cart.objects.get(user=self.user)
        self.assertEqual(cart.items.count(), 1, 'cart must remain until payment confirmed')
        order = Order.objects.get(user=self.user)
        self.assertEqual(order.payment_status, 'unpaid')

    @mock.patch('orders.zarinpal.verify_payment', return_value={'ref_id': 'REF999'})
    @mock.patch('orders.zarinpal.request_payment',
                return_value={'authority': 'AUTH123', 'pay_url': 'https://pay.test/AUTH123'})
    def test_successful_payment_deducts_stock_and_clears_cart(self, _req, _ver):
        self._add_to_cart(3)
        self._checkout()
        order = Order.objects.get(user=self.user)
        resp = self._verify(order, 'AUTH123', 'OK')
        self.assertEqual(resp.status_code, 302)
        self.assertIn('status=success', resp.url)
        order.refresh_from_db()
        self.product.refresh_from_db()
        self.assertEqual(order.payment_status, 'paid')
        self.assertEqual(order.status, 'processing')
        self.assertEqual(self.product.stock, 7, 'stock deducted on confirmation')
        self.assertEqual(Cart.objects.get(user=self.user).items.count(), 0, 'cart cleared on success')
        self.assertEqual(order.payments.first().ref_id, 'REF999')

    @mock.patch('orders.zarinpal.request_payment',
                return_value={'authority': 'AUTH123', 'pay_url': 'https://pay.test/AUTH123'})
    def test_failed_payment_keeps_stock_and_cart(self, _req):
        self._add_to_cart(3)
        self._checkout()
        order = Order.objects.get(user=self.user)
        resp = self._verify(order, 'AUTH123', 'NOK')  # user cancelled
        self.assertEqual(resp.status_code, 302)
        self.assertIn('status=failed', resp.url)
        order.refresh_from_db()
        self.product.refresh_from_db()
        self.assertEqual(order.payment_status, 'failed')
        self.assertEqual(self.product.stock, 10, 'stock untouched on failure (no leak)')
        self.assertEqual(Cart.objects.get(user=self.user).items.count(), 1, 'cart intact so user can retry')

    @mock.patch('orders.zarinpal.verify_payment', return_value={'ref_id': 'REF999'})
    @mock.patch('orders.zarinpal.request_payment',
                return_value={'authority': 'AUTH123', 'pay_url': 'https://pay.test/AUTH123'})
    def test_duplicate_success_callback_does_not_double_deduct(self, _req, _ver):
        self._add_to_cart(3)
        self._checkout()
        order = Order.objects.get(user=self.user)
        self._verify(order, 'AUTH123', 'OK')
        self._verify(order, 'AUTH123', 'OK')  # replay
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 7, 'idempotent: deducted exactly once')

    def test_checkout_blocks_when_stock_insufficient(self):
        self._add_to_cart(3)
        Product.objects.filter(pk=self.product.pk).update(stock=1)  # stock dropped after add
        r = self._checkout()
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)
