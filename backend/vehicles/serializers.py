from rest_framework import serializers
from .models import VehicleBrand, VehicleModel, VehicleTrim


class VehicleBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleBrand
        fields = ('id', 'name', 'slug', 'logo')


class VehicleModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleModel
        fields = ('id', 'name', 'slug', 'brand')


class VehicleTrimSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleTrim
        fields = ('id', 'name', 'year_from', 'year_to', 'model')
