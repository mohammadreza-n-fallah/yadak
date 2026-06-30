"""Shop tests — product listing/detail and review constraints."""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User
from shop.models import Category, Product, ProductReview


class ProductReviewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='r', email='r@t.local', password='pw')
        self.cat = Category.objects.create(name='c', slug='c')
        self.product = Product.objects.create(name='p', slug='p', category=self.cat, price=1000, stock=5)
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.url = reverse('product-reviews', kwargs={'slug': self.product.slug})

    def test_first_review_created(self):
        r = self.client.post(self.url, {'rating': 5, 'body': 'خوب'}, format='json')
        self.assertEqual(r.status_code, 201)

    def test_duplicate_review_returns_400_not_500(self):
        self.client.post(self.url, {'rating': 5, 'body': 'خوب'}, format='json')
        r = self.client.post(self.url, {'rating': 3, 'body': 'دوباره'}, format='json')
        self.assertEqual(r.status_code, 400, 'second review must be a clean 400, not a 500')
        self.assertEqual(ProductReview.objects.filter(product=self.product, user=self.user).count(), 1)

    def test_review_requires_auth(self):
        r = APIClient().post(self.url, {'rating': 5, 'body': 'x'}, format='json')
        self.assertEqual(r.status_code, 401)

    def test_review_on_missing_product_404(self):
        r = self.client.post(reverse('product-reviews', kwargs={'slug': 'nope'}),
                             {'rating': 5, 'body': 'x'}, format='json')
        self.assertEqual(r.status_code, 404)


class ProductListingTests(TestCase):
    def setUp(self):
        self.cat = Category.objects.create(name='c', slug='c')
        Product.objects.create(name='فعال', slug='active', category=self.cat, price=1000, stock=5, is_active=True)
        Product.objects.create(name='غیرفعال', slug='inactive', category=self.cat, price=1000, stock=5, is_active=False)

    def test_inactive_products_hidden_from_listing(self):
        r = APIClient().get(reverse('products'))
        slugs = [p['slug'] for p in r.json()['results']]
        self.assertIn('active', slugs)
        self.assertNotIn('inactive', slugs)

    def test_inactive_product_detail_404(self):
        r = APIClient().get(reverse('product-detail', kwargs={'slug': 'inactive'}))
        self.assertEqual(r.status_code, 404)
