from django.db import models


class VehicleBrand(models.Model):
    name = models.CharField('نام برند', max_length=100)
    slug = models.SlugField('اسلاگ', unique=True, allow_unicode=True)
    logo = models.ImageField('لوگو', upload_to='vehicles/brands/', null=True, blank=True)
    is_active = models.BooleanField('فعال', default=True)
    order = models.PositiveIntegerField('ترتیب', default=0)

    class Meta:
        verbose_name = 'برند خودرو'
        verbose_name_plural = 'برندهای خودرو'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class VehicleModel(models.Model):
    brand = models.ForeignKey(VehicleBrand, on_delete=models.CASCADE, related_name='models', verbose_name='برند')
    name = models.CharField('نام مدل', max_length=100)
    slug = models.SlugField('اسلاگ', allow_unicode=True)
    is_active = models.BooleanField('فعال', default=True)

    class Meta:
        verbose_name = 'مدل خودرو'
        verbose_name_plural = 'مدل‌های خودرو'
        unique_together = ('brand', 'slug')
        ordering = ['name']

    def __str__(self):
        return f'{self.brand.name} {self.name}'


class VehicleTrim(models.Model):
    model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name='trims', verbose_name='مدل')
    name = models.CharField('تیپ', max_length=100)
    year_from = models.PositiveIntegerField('از سال', null=True, blank=True)
    year_to = models.PositiveIntegerField('تا سال', null=True, blank=True)
    is_active = models.BooleanField('فعال', default=True)

    class Meta:
        verbose_name = 'تیپ خودرو'
        verbose_name_plural = 'تیپ‌های خودرو'
        ordering = ['name']

    def __str__(self):
        years = ''
        if self.year_from and self.year_to:
            years = f' ({self.year_from}-{self.year_to})'
        elif self.year_from:
            years = f' (از {self.year_from})'
        return f'{self.model} - {self.name}{years}'
