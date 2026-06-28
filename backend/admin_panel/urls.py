from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('stats/', views.DashboardStatsView.as_view(), name='admin-stats'),

    # Categories
    path('categories/', views.AdminCategoryListView.as_view(), name='admin-categories'),
    path('categories/<int:pk>/', views.AdminCategoryDetailView.as_view(), name='admin-category-detail'),

    # Brands
    path('brands/', views.AdminBrandListView.as_view(), name='admin-brands'),
    path('brands/<int:pk>/', views.AdminBrandDetailView.as_view(), name='admin-brand-detail'),

    # Products
    path('products/', views.AdminProductListView.as_view(), name='admin-products'),
    path('products/<int:pk>/', views.AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('products/<int:pk>/images/', views.AdminProductImageUploadView.as_view(), name='admin-product-images'),

    # Orders
    path('orders/', views.AdminOrderListView.as_view(), name='admin-orders'),
    path('orders/<int:pk>/', views.AdminOrderDetailView.as_view(), name='admin-order-detail'),

    # Users
    path('users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),

    # Blog
    path('posts/', views.AdminPostListView.as_view(), name='admin-posts'),
    path('posts/<int:pk>/', views.AdminPostDetailView.as_view(), name='admin-post-detail'),
    path('post-categories/', views.AdminPostCategoryListView.as_view(), name='admin-post-categories'),

    # Banners
    path('banners/', views.AdminBannerListView.as_view(), name='admin-banners'),
    path('banners/<int:pk>/', views.AdminBannerDetailView.as_view(), name='admin-banner-detail'),

    # Reviews
    path('reviews/', views.AdminReviewListView.as_view(), name='admin-reviews'),
    path('reviews/<int:pk>/', views.AdminReviewUpdateView.as_view(), name='admin-review-update'),
    path('reviews/<int:pk>/delete/', views.AdminReviewDestroyView.as_view(), name='admin-review-delete'),
]
