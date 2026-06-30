"""Core endpoint tests — newsletter (incl. friendly re-subscribe) and contact."""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import Newsletter, ContactMessage


class NewsletterTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_subscribe_new_email(self):
        r = self.client.post(reverse('newsletter'), {'email': 'new@t.local'}, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertTrue(Newsletter.objects.filter(email='new@t.local', is_active=True).exists())

    def test_resubscribe_existing_is_friendly_not_400(self):
        Newsletter.objects.create(email='dup@t.local', is_active=True)
        r = self.client.post(reverse('newsletter'), {'email': 'dup@t.local'}, format='json')
        # Must NOT be a raw 400 uniqueness error — the view returns a friendly 200.
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIn('message', r.json())

    def test_reactivate_unsubscribed_email(self):
        Newsletter.objects.create(email='back@t.local', is_active=False)
        r = self.client.post(reverse('newsletter'), {'email': 'back@t.local'}, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertTrue(Newsletter.objects.get(email='back@t.local').is_active)

    def test_invalid_email_rejected(self):
        r = self.client.post(reverse('newsletter'), {'email': 'not-an-email'}, format='json')
        self.assertEqual(r.status_code, 400)


class ContactTests(TestCase):
    def test_contact_message_created(self):
        r = APIClient().post(reverse('contact'), {
            'name': 'علی', 'email': 'a@t.local', 'subject': 'سوال', 'message': 'سلام',
        }, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)
