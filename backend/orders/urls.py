from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/clear/', views.CartClearView.as_view(), name='cart-clear'),
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
    path('payment/verify/', views.PaymentVerifyView.as_view(), name='payment-verify'),
    path('track/', views.OrderTrackView.as_view(), name='order-track'),
    path('', views.OrderListView.as_view(), name='order-list'),
    path('<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
]
