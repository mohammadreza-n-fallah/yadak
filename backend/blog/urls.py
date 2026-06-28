from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.PostCategoryListView.as_view(), name='post-categories'),
    path('', views.PostListView.as_view(), name='post-list'),
    path('<slug:slug>/', views.PostDetailView.as_view(), name='post-detail'),
]
