from rest_framework import generics, permissions
from .models import VehicleBrand, VehicleModel, VehicleTrim
from .serializers import VehicleBrandSerializer, VehicleModelSerializer, VehicleTrimSerializer


class VehicleBrandListView(generics.ListAPIView):
    queryset = VehicleBrand.objects.filter(is_active=True)
    serializer_class = VehicleBrandSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class VehicleModelListView(generics.ListAPIView):
    serializer_class = VehicleModelSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        brand_id = self.kwargs.get('brand_id')
        return VehicleModel.objects.filter(brand_id=brand_id, is_active=True)


class VehicleTrimListView(generics.ListAPIView):
    serializer_class = VehicleTrimSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        model_id = self.kwargs.get('model_id')
        return VehicleTrim.objects.filter(model_id=model_id, is_active=True)
