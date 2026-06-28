from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from shop.models import Category, Brand, Product, ProductImage, Banner, ProductReview
from orders.models import Order
from blog.models import Post, PostCategory
from accounts.models import User

from .serializers import (
    AdminCategorySerializer, AdminBrandSerializer,
    AdminProductListSerializer, AdminProductDetailSerializer, AdminProductCreateSerializer,
    AdminProductImageSerializer,
    AdminOrderSerializer,
    AdminUserSerializer,
    AdminPostSerializer, AdminPostCategorySerializer,
    AdminBannerSerializer,
    AdminReviewSerializer,
)


class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


def _as_bool(value):
    """Coerce a multipart string ('true'/'false') or JSON bool to a Python bool."""
    if isinstance(value, str):
        return value.strip().lower() not in ('false', '0', '', 'none')
    return bool(value)


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)

        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(payment_status='paid').aggregate(t=Sum('total'))['t'] or 0
        total_products = Product.objects.filter(is_active=True).count()
        total_users = User.objects.filter(is_active=True, is_staff=False).count()

        month_orders = Order.objects.filter(created_at__gte=month_start).count()
        month_revenue = Order.objects.filter(
            payment_status='paid', created_at__gte=month_start
        ).aggregate(t=Sum('total'))['t'] or 0
        last_month_revenue = Order.objects.filter(
            payment_status='paid', created_at__gte=last_month_start, created_at__lt=month_start
        ).aggregate(t=Sum('total'))['t'] or 0
        revenue_growth = round(
            ((month_revenue - last_month_revenue) / last_month_revenue * 100)
            if last_month_revenue else 0, 1
        )

        low_stock_count = Product.objects.filter(is_active=True, stock__lte=5).count()
        pending_orders = Order.objects.filter(status='pending').count()

        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:8]

        # Daily revenue for last 7 days
        daily_revenue = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59)
            rev = Order.objects.filter(
                payment_status='paid', created_at__range=(day_start, day_end)
            ).aggregate(t=Sum('total'))['t'] or 0
            daily_revenue.append({'date': day.strftime('%m/%d'), 'revenue': float(rev)})

        status_counts = {s: Order.objects.filter(status=s).count() for s, _ in Order.STATUS_CHOICES}

        return Response({
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'total_products': total_products,
            'total_users': total_users,
            'month_orders': month_orders,
            'month_revenue': float(month_revenue),
            'revenue_growth': revenue_growth,
            'low_stock_count': low_stock_count,
            'pending_orders': pending_orders,
            'daily_revenue': daily_revenue,
            'status_counts': status_counts,
            'recent_orders': AdminOrderSerializer(recent_orders, many=True).data,
        })


# ── Categories ────────────────────────────────────────────────────────────────

class AdminCategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by('order', 'name')
    serializer_class = AdminCategorySerializer
    permission_classes = [IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    pagination_class = None
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


# ── Brands ───────────────────────────────────────────────────────────────────

class AdminBrandListView(generics.ListCreateAPIView):
    queryset = Brand.objects.all().order_by('order', 'name')
    serializer_class = AdminBrandSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    pagination_class = None
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class AdminBrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Brand.objects.all()
    serializer_class = AdminBrandSerializer
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


# ── Products ─────────────────────────────────────────────────────────────────

class AdminProductListView(generics.ListCreateAPIView):
    permission_classes = [IsStaffUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_featured', 'badge', 'category', 'brand']
    search_fields = ['name', 'part_number', 'slug']
    ordering_fields = ['created_at', 'price', 'stock', 'name']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Product.objects.all().select_related('category', 'brand').prefetch_related('images')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminProductCreateSerializer
        return AdminProductListSerializer


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all().prefetch_related('images')
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminProductCreateSerializer
        return AdminProductDetailSerializer


class AdminProductImageUploadView(APIView):
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        product = generics.get_object_or_404(Product, pk=pk)
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'تصویر ارسال نشد'}, status=status.HTTP_400_BAD_REQUEST)
        is_main = _as_bool(request.data.get('is_main', 'false'))
        if is_main:
            ProductImage.objects.filter(product=product, is_main=True).update(is_main=False)
        img = ProductImage.objects.create(
            product=product,
            image=image_file,
            alt=request.data.get('alt', product.name),
            is_main=is_main,
            order=ProductImage.objects.filter(product=product).count(),
        )
        return Response(AdminProductImageSerializer(img).data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        """Mark one of the product's existing images as the main image."""
        image_id = request.data.get('image_id')
        img = generics.get_object_or_404(ProductImage, pk=image_id, product_id=pk)
        # Only one image can be main per product.
        ProductImage.objects.filter(product_id=pk, is_main=True).exclude(pk=img.pk).update(is_main=False)
        if not img.is_main:
            img.is_main = True
            img.save(update_fields=['is_main'])
        return Response(AdminProductImageSerializer(img).data)

    def delete(self, request, pk):
        image_id = request.data.get('image_id')
        img = generics.get_object_or_404(ProductImage, pk=image_id, product_id=pk)
        was_main = img.is_main
        img.delete()
        # If the main image was removed, promote the next one so the product
        # still has an explicit main image.
        if was_main:
            nxt = ProductImage.objects.filter(product_id=pk).order_by('order', 'id').first()
            if nxt:
                nxt.is_main = True
                nxt.save(update_fields=['is_main'])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Orders ───────────────────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    search_fields = ['order_number', 'shipping_full_name', 'shipping_phone']
    ordering_fields = ['created_at', 'total']
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.all().select_related('user').prefetch_related('items')


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    queryset = Order.objects.all().prefetch_related('items')
    serializer_class = AdminOrderSerializer
    permission_classes = [IsStaffUser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        allowed = {'status', 'tracking_code', 'note'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ── Users ─────────────────────────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['date_joined', 'username']
    ordering = ['-date_joined']

    def get_queryset(self):
        return User.objects.all()


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsStaffUser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        allowed = {'is_active', 'is_staff', 'first_name', 'last_name'}
        data = {k: v for k, v in request.data.items() if k in allowed}

        # Prevent an admin from locking themselves out of the panel.
        if instance.pk == request.user.pk:
            for field in ('is_active', 'is_staff'):
                if field in data and not _as_bool(data[field]):
                    return Response(
                        {'error': 'نمی‌توانید دسترسی مدیریت یا فعال‌بودن حساب خودتان را غیرفعال کنید.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ── Blog Posts ────────────────────────────────────────────────────────────────

class AdminPostCategoryListView(generics.ListCreateAPIView):
    queryset = PostCategory.objects.all()
    serializer_class = AdminPostCategorySerializer
    permission_classes = [IsStaffUser]
    pagination_class = None


class AdminPostListView(generics.ListCreateAPIView):
    serializer_class = AdminPostSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_published', 'category']
    search_fields = ['title', 'excerpt']
    ordering_fields = ['created_at', 'views']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Post.objects.all().select_related('author', 'category')

    def perform_create(self, serializer):
        kwargs = {'author': self.request.user}
        if serializer.validated_data.get('is_published') and not serializer.validated_data.get('published_at'):
            kwargs['published_at'] = timezone.now()
        serializer.save(**kwargs)


class AdminPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = AdminPostSerializer
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_update(self, serializer):
        kwargs = {}
        if (serializer.validated_data.get('is_published')
                and not serializer.instance.published_at
                and not serializer.validated_data.get('published_at')):
            kwargs['published_at'] = timezone.now()
        serializer.save(**kwargs)


# ── Banners ───────────────────────────────────────────────────────────────────

class AdminBannerListView(generics.ListCreateAPIView):
    queryset = Banner.objects.all().order_by('order')
    serializer_class = AdminBannerSerializer
    permission_classes = [IsStaffUser]
    pagination_class = None
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class AdminBannerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Banner.objects.all()
    serializer_class = AdminBannerSerializer
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


# ── Reviews ───────────────────────────────────────────────────────────────────

class AdminReviewListView(generics.ListAPIView):
    serializer_class = AdminReviewSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_approved']
    search_fields = ['title', 'body', 'user__username', 'product__name']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        return ProductReview.objects.all().select_related('product', 'user')


class AdminReviewUpdateView(generics.UpdateAPIView):
    queryset = ProductReview.objects.all()
    serializer_class = AdminReviewSerializer
    permission_classes = [IsStaffUser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        allowed = {'is_approved'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminReviewDestroyView(generics.DestroyAPIView):
    queryset = ProductReview.objects.all()
    permission_classes = [IsStaffUser]
