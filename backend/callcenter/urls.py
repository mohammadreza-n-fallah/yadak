from django.urls import path
from . import views

urlpatterns = [
    # Public (caller side)
    path('calls/start/', views.CallStartView.as_view(), name='call-start'),
    path('calls/turn/', views.CallTurnView.as_view(), name='call-turn'),
    path('calls/end/', views.CallEndView.as_view(), name='call-end'),
    path('callback/', views.CallbackRequestView.as_view(), name='call-callback'),

    # Staff side
    path('admin/stats/', views.CallCenterStatsView.as_view(), name='call-stats'),
    path('admin/calls/', views.AdminCallListView.as_view(), name='call-admin-list'),
    path('admin/calls/<int:pk>/', views.AdminCallDetailView.as_view(), name='call-admin-detail'),
    path('admin/callbacks/', views.AdminCallbackListView.as_view(), name='call-admin-callbacks'),
    path('admin/callbacks/<int:pk>/', views.AdminCallbackDetailView.as_view(), name='call-admin-callback-detail'),
]
