"""Auth tests — login works with either username or email."""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='ali', email='Ali@Example.com', password='StrongPass123',
        )
        self.url = reverse('login')

    def test_login_with_username(self):
        r = self.client.post(self.url, {'username': 'ali', 'password': 'StrongPass123'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIn('access', r.json())

    def test_login_with_email(self):
        r = self.client.post(self.url, {'username': 'ali@example.com', 'password': 'StrongPass123'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIn('access', r.json())

    def test_login_with_email_is_case_insensitive(self):
        r = self.client.post(self.url, {'username': 'ALI@EXAMPLE.COM', 'password': 'StrongPass123'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)

    def test_wrong_password_rejected(self):
        r = self.client.post(self.url, {'username': 'ali', 'password': 'nope'}, format='json')
        self.assertEqual(r.status_code, 401)

    def test_unknown_email_rejected(self):
        r = self.client.post(self.url, {'username': 'ghost@example.com', 'password': 'whatever'}, format='json')
        self.assertEqual(r.status_code, 401)

    def test_username_containing_at_still_resolves(self):
        # A username that literally contains '@' must still match as a username.
        User.objects.create_user(username='weird@name', email='', password='StrongPass123')
        r = self.client.post(self.url, {'username': 'weird@name', 'password': 'StrongPass123'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
