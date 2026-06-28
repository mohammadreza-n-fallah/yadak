from rest_framework import generics, permissions
from .models import Post, PostCategory
from .serializers import PostListSerializer, PostDetailSerializer, PostCategorySerializer


class PostCategoryListView(generics.ListAPIView):
    queryset = PostCategory.objects.all()
    serializer_class = PostCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class PostListView(generics.ListAPIView):
    serializer_class = PostListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['category__slug']
    search_fields = ['title', 'excerpt']

    def get_queryset(self):
        return Post.objects.filter(is_published=True).select_related('author', 'category')


class PostDetailView(generics.RetrieveAPIView):
    serializer_class = PostDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Post.objects.filter(is_published=True)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        return super().retrieve(request, *args, **kwargs)
