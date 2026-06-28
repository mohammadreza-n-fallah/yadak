from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Category, Brand, Product, ProductReview, Wishlist, Banner
from .serializers import (
    CategorySerializer, BrandSerializer, ProductListSerializer,
    ProductDetailSerializer, ProductReviewSerializer, WishlistSerializer, BannerSerializer,
)
from .filters import ProductFilter


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True, parent__isnull=True)


class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class BrandListView(generics.ListAPIView):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'part_number', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related('category', 'brand').prefetch_related('images')

        # Filter by compatible vehicle trim
        trim_id = self.request.query_params.get('trim')
        if trim_id:
            qs = qs.filter(compatible_vehicles__id=trim_id)

        # Featured products
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            qs = qs.filter(is_featured=True)

        # Sale products
        on_sale = self.request.query_params.get('on_sale')
        if on_sale == 'true':
            qs = qs.filter(sale_price__isnull=False)

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class ProductReviewCreateView(generics.CreateAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        product = generics.get_object_or_404(Product, slug=self.kwargs['slug'])
        serializer.save(user=self.request.user, product=product)


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        return Response(WishlistSerializer(wishlist).data)

    def post(self, request):
        product_id = request.data.get('product_id')
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'محصول یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

        if wishlist.products.filter(pk=product_id).exists():
            wishlist.products.remove(product)
            return Response({'status': 'removed'})
        else:
            wishlist.products.add(product)
            return Response({'status': 'added'})


class BannerListView(generics.ListAPIView):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class HomepageView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        featured = Product.objects.filter(is_active=True, is_featured=True).select_related('category', 'brand').prefetch_related('images')[:8]
        on_sale = Product.objects.filter(is_active=True, sale_price__isnull=False).select_related('category', 'brand').prefetch_related('images')[:8]
        new_arrivals = Product.objects.filter(is_active=True).order_by('-created_at').select_related('category', 'brand').prefetch_related('images')[:8]
        categories = Category.objects.filter(is_active=True, parent__isnull=True)[:6]
        brands = Brand.objects.filter(is_active=True)[:16]
        banners = Banner.objects.filter(is_active=True)[:3]

        from blog.models import Post
        from blog.serializers import PostListSerializer
        recent_posts = Post.objects.filter(is_published=True).order_by('-published_at')[:4]

        return Response({
            'featured_products': ProductListSerializer(featured, many=True, context={'request': request}).data,
            'on_sale_products': ProductListSerializer(on_sale, many=True, context={'request': request}).data,
            'new_arrivals': ProductListSerializer(new_arrivals, many=True, context={'request': request}).data,
            'categories': CategorySerializer(categories, many=True, context={'request': request}).data,
            'brands': BrandSerializer(brands, many=True, context={'request': request}).data,
            'banners': BannerSerializer(banners, many=True, context={'request': request}).data,
            'recent_posts': PostListSerializer(recent_posts, many=True, context={'request': request}).data,
        })
