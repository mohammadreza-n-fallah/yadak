from django.urls import path
from . import views

urlpatterns = [
    path('config/', views.SupportConfigView.as_view(), name='support-config'),
    path('faqs/', views.FAQListView.as_view(), name='support-faqs'),
    path('history/', views.HistoryView.as_view(), name='support-history'),
    path('chat/', views.ChatView.as_view(), name='support-chat'),
    path('chat/stream/', views.ChatStreamView.as_view(), name='support-chat-stream'),
]
