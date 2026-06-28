from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='banner',
            name='position',
            field=models.CharField(
                choices=[('hero', 'هدر اصلی'), ('sidebar', 'کنار'), ('promo', 'تبلیغاتی'), ('footer', 'فوتر')],
                default='hero',
                max_length=20,
                verbose_name='موقعیت',
            ),
        ),
    ]
