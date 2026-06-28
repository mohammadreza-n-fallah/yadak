import django_filters
from .models import Category, Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    category = django_filters.CharFilter(method='filter_by_category')
    brand = django_filters.CharFilter(field_name='brand__slug')
    in_stock = django_filters.BooleanFilter(field_name='stock', method='filter_in_stock')
    badge = django_filters.CharFilter(field_name='badge')

    class Meta:
        model = Product
        fields = ['min_price', 'max_price', 'category', 'brand', 'in_stock', 'badge']

    def filter_by_category(self, queryset, name, value):
        try:
            cat = Category.objects.get(slug=value, is_active=True)
        except Category.DoesNotExist:
            return queryset.none()
        # Include the category itself and all direct children
        child_ids = list(cat.children.filter(is_active=True).values_list('id', flat=True))
        category_ids = [cat.id] + child_ids
        return queryset.filter(category__id__in=category_ids)

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset
