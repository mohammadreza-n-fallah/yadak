from django.urls import path
from . import views

urlpatterns = [
    path('brands/', views.VehicleBrandListView.as_view(), name='vehicle-brands'),
    path('brands/<int:brand_id>/models/', views.VehicleModelListView.as_view(), name='vehicle-models'),
    path('models/<int:model_id>/trims/', views.VehicleTrimListView.as_view(), name='vehicle-trims'),
]
