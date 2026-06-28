from django.urls import path
from . import views

urlpatterns = [
    path('newsletter/', views.NewsletterSubscribeView.as_view(), name='newsletter'),
    path('contact/', views.ContactView.as_view(), name='contact'),
    path('settings/', views.SiteSettingsView.as_view(), name='site-settings'),
]
