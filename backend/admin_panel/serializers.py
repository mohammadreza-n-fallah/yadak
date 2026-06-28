from rest_framework import serializers
from shop.models import Category, Brand, Product, ProductImage, Banner, ProductReview
from orders.models import Order, OrderItem
from blog.models import Post, PostCategory
from accounts.models import User


# ── Categories ──────────────────────────────────────────────────────────────

class AdminCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'image', 'description', 'parent', 'parent_name',
                  'is_active', 'order', 'product_count')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


# ── Brands ───────────────────────────────────────────────────────────────────

class AdminBrandSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'logo', 'is_active', 'order', 'product_count')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


# ── Products ─────────────────────────────────────────────────────────────────

class AdminProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt', 'is_main', 'order')


class AdminProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    main_image = AdminProductImageSerializer(read_only=True)
    effective_price = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'part_number', 'price', 'sale_price',
                  'effective_price', 'discount_percent', 'stock', 'badge',
                  'is_active', 'is_featured', 'category', 'category_name',
                  'brand', 'brand_name', 'main_image', 'created_at')


class AdminProductDetailSerializer(serializers.ModelSerializer):
    images = AdminProductImageSerializer(many=True, read_only=True)
    effective_price = serializers.DecimalField(max_digits=14, decimal_places=0, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class AdminProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'part_number', 'description', 'category', 'brand',
                  'price', 'sale_price', 'stock', 'weight', 'badge',
                  'is_active', 'is_featured', 'compatible_vehicles')
        read_only_fields = ('id',)

    def validate_slug(self, value):
        qs = Product.objects.filter(slug=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('این اسلاگ قبلاً استفاده شده است.')
        return value


# ── Orders ───────────────────────────────────────────────────────────────────

class AdminOrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ('id', 'product_name', 'product_part_number', 'unit_price', 'quantity', 'subtotal', 'product_image')

    def get_product_image(self, obj):
        if obj.product:
            img = obj.product.main_image
            if img and img.image:
                request = self.context.get('request')
                url = img.image.url
                if request:
                    return request.build_absolute_uri(url)
                return url
        return None


class AdminOrderSerializer(serializers.ModelSerializer):
    items = AdminOrderItemSerializer(many=True, read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return obj.shipping_full_name

    def validate_status(self, value):
        allowed = [c[0] for c in Order.STATUS_CHOICES]
        if value not in allowed:
            raise serializers.ValidationError('وضعیت نامعتبر')
        return value


# ── Users ─────────────────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone',
                  'is_active', 'is_staff', 'date_joined', 'order_count', 'total_spent')

    def get_order_count(self, obj):
        return obj.orders.count()

    def get_total_spent(self, obj):
        from django.db.models import Sum
        result = obj.orders.filter(payment_status='paid').aggregate(total=Sum('total'))
        return result['total'] or 0


# ── Blog ─────────────────────────────────────────────────────────────────────

class AdminPostCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = PostCategory
        fields = ('id', 'name', 'slug', 'post_count')

    def get_post_count(self, obj):
        return obj.posts.count()


class AdminPostSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'title', 'slug', 'excerpt', 'body', 'image',
                  'category', 'category_name', 'author', 'author_name',
                  'is_published', 'published_at', 'views', 'created_at')

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return ''


# ── Banners ───────────────────────────────────────────────────────────────────

class AdminBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ('id', 'title', 'subtitle', 'image', 'link', 'position', 'is_active', 'order')


# ── Reviews ───────────────────────────────────────────────────────────────────

class AdminReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ('id', 'product', 'product_name', 'user', 'user_name',
                  'rating', 'title', 'body', 'is_approved', 'created_at')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
