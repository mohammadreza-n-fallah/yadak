from rest_framework import serializers
from .models import Category, Brand, Product, ProductImage, ProductReview, Wishlist, Banner


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'image', 'description', 'parent', 'children')

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'logo')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt', 'is_main', 'order')


class ProductReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ('id', 'author_name', 'rating', 'title', 'body', 'created_at')
        read_only_fields = ('id', 'author_name', 'created_at')

    def get_author_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class ProductListSerializer(serializers.ModelSerializer):
    main_image = ProductImageSerializer(read_only=True)
    effective_price = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'part_number', 'price', 'sale_price',
            'effective_price', 'discount_percent', 'stock', 'is_in_stock',
            'badge', 'main_image', 'average_rating', 'review_count',
            'category_name', 'brand_name', 'is_featured',
        )


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    main_image = ProductImageSerializer(read_only=True)
    reviews = serializers.SerializerMethodField()
    effective_price = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    brand_slug = serializers.CharField(source='brand.slug', read_only=True)
    compatible_vehicles = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_reviews(self, obj):
        approved = obj.reviews.filter(is_approved=True)
        return ProductReviewSerializer(approved, many=True).data

    def get_compatible_vehicles(self, obj):
        from vehicles.serializers import VehicleTrimSerializer
        return VehicleTrimSerializer(obj.compatible_vehicles.all(), many=True).data


class WishlistSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = ('products',)


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ('id', 'title', 'subtitle', 'image', 'link')
