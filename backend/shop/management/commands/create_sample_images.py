"""
Generate 4-5 placeholder product images per product (varied views).
Run: python manage.py create_sample_images [--force]
"""
import io
import math
import random
from PIL import Image, ImageDraw
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from shop.models import Product, ProductImage


CATEGORY_THEME = {
    'brake-kits':          ('#FFF5F5', '#E53E3E', '#C53030'),
    'brake-pads':          ('#FFF5F5', '#E53E3E', '#C53030'),
    'brake-system':        ('#FFF5F5', '#E53E3E', '#C53030'),
    'electrical':          ('#FFFFF0', '#D69E2E', '#B7791F'),
    'suspension':          ('#EBF8FF', '#3182CE', '#2B6CB0'),
    'body':                ('#F0FFF4', '#38A169', '#276749'),
    'engine-transmission': ('#FFFAF0', '#DD6B20', '#C05621'),
    'tires-wheels':        ('#F7FAFC', '#718096', '#4A5568'),
    'tires':               ('#F7FAFC', '#718096', '#4A5568'),
    'wheel-disks':         ('#F7FAFC', '#718096', '#4A5568'),
}
DEFAULT_THEME = ('#F8F9FA', '#6366F1', '#4F46E5')


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return '#{:02X}{:02X}{:02X}'.format(*rgb)


def darken(rgb, factor=0.85):
    return tuple(max(0, int(c * factor)) for c in rgb)


def lighten(rgb, factor=1.12):
    return tuple(min(255, int(c * factor)) for c in rgb)


def clamp_rgb(rgb):
    return tuple(max(0, min(255, c)) for c in rgb)


# ── Icon drawers ──────────────────────────────────────────────────────────────

def draw_brake_disc(draw, cx, cy, r, accent, icon):
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=hex_to_rgb(accent), width=10)
    draw.ellipse([cx-r//2, cy-r//2, cx+r//2, cy+r//2], outline=hex_to_rgb(icon), width=6)
    for angle in range(0, 360, 60):
        x = cx + int((r * 0.7) * math.cos(math.radians(angle)))
        y = cy + int((r * 0.7) * math.sin(math.radians(angle)))
        draw.ellipse([x-8, y-8, x+8, y+8], fill=hex_to_rgb(icon))


def draw_bolt(draw, cx, cy, r, accent, icon):
    pts = []
    for i in range(6):
        a = math.radians(60 * i - 30)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    draw.polygon(pts, outline=hex_to_rgb(accent), width=8)
    draw.ellipse([cx-r//3, cy-r//3, cx+r//3, cy+r//3], fill=hex_to_rgb(icon))
    draw.rectangle([cx-10, cy+r, cx+10, cy+int(r*1.6)], fill=hex_to_rgb(accent))


def draw_spring(draw, cx, cy, r, accent, _icon):
    top, bot = cy - r, cy + r
    height = bot - top
    coils = 5
    for i in range(coils * 2 + 1):
        t = i / (coils * 2)
        y = top + int(t * height)
        x_off = int(r * 0.5 * (1 if i % 2 == 0 else -1))
        if i > 0:
            t_prev = (i - 1) / (coils * 2)
            y_prev = top + int(t_prev * height)
            x_prev = int(r * 0.5 * (1 if (i-1) % 2 == 0 else -1))
            draw.line([cx+x_prev, y_prev, cx+x_off, y], fill=hex_to_rgb(accent), width=8)
    draw.rectangle([cx-r//2, top-15, cx+r//2, top+5], fill=hex_to_rgb(accent))
    draw.rectangle([cx-r//2, bot-5, cx+r//2, bot+15], fill=hex_to_rgb(accent))


def draw_car_body(draw, cx, cy, r, accent, _icon):
    w, h = int(r * 1.8), int(r * 0.7)
    draw.rectangle([cx-w//2, cy-h//4, cx+w//2, cy+h//2], fill=hex_to_rgb(accent))
    draw.rectangle([cx-w//3, cy-h//4-h//2, cx+w//3, cy-h//4], fill=hex_to_rgb(accent))
    wr = h // 3
    for wx in [cx - w//3, cx + w//3]:
        draw.ellipse([wx-wr, cy+h//4, wx+wr, cy+h//4+wr*2], fill=hex_to_rgb(_icon))


def draw_gear(draw, cx, cy, r, accent, icon):
    teeth = 8
    inner = int(r * 0.6)
    pts = []
    for i in range(teeth * 2):
        angle = math.radians(i * 360 / (teeth * 2))
        rad = r if i % 2 == 0 else inner
        pts.append((cx + rad * math.cos(angle), cy + rad * math.sin(angle)))
    draw.polygon(pts, fill=hex_to_rgb(accent))
    draw.ellipse([cx-inner//2, cy-inner//2, cx+inner//2, cy+inner//2], fill=hex_to_rgb(icon))


def draw_tyre(draw, cx, cy, r, accent, icon):
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=hex_to_rgb(icon))
    inner = int(r * 0.55)
    draw.ellipse([cx-inner, cy-inner, cx+inner, cy+inner], fill=hex_to_rgb(accent))
    hub = int(r * 0.18)
    draw.ellipse([cx-hub, cy-hub, cx+hub, cy+hub], fill=hex_to_rgb(icon))


def draw_lightning(draw, cx, cy, r, accent, _icon):
    pts = [
        (cx + 15, cy - r),
        (cx - 5, cy),
        (cx + 10, cy),
        (cx - 15, cy + r),
        (cx + 5, cy),
        (cx - 10, cy),
    ]
    draw.polygon(pts, fill=hex_to_rgb(accent))


ICON_DRAWERS = {
    'brake-kits':          draw_brake_disc,
    'brake-pads':          draw_brake_disc,
    'brake-system':        draw_brake_disc,
    'electrical':          draw_lightning,
    'suspension':          draw_spring,
    'body':                draw_car_body,
    'engine-transmission': draw_gear,
    'tires-wheels':        draw_tyre,
    'tires':               draw_tyre,
    'wheel-disks':         draw_tyre,
}
DEFAULT_ICON = draw_bolt


# ── Variant builders ──────────────────────────────────────────────────────────

def _base_image(bg_rgb, size):
    return Image.new('RGB', (size, size), bg_rgb)


def _draw_bg_circle(draw, cx, cy, size, bg_rgb, shade_fn):
    r = int(size * 0.38)
    fill = clamp_rgb(shade_fn(bg_rgb))
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=fill)


def _save_jpeg(img):
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=92)
    buf.seek(0)
    return buf


def variant_standard(product, size=600):
    """Light background, centered icon, part-number strip."""
    cat_slug = product.category.slug if product.category else ''
    bg_hex, accent_hex, icon_hex = CATEGORY_THEME.get(cat_slug, DEFAULT_THEME)
    bg_rgb = hex_to_rgb(bg_hex)

    img = _base_image(bg_rgb, size)
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2

    _draw_bg_circle(draw, cx, cy, size, bg_rgb, darken)

    drawer = ICON_DRAWERS.get(cat_slug, DEFAULT_ICON)
    drawer(draw, cx, cy, int(size * 0.27), accent_hex, icon_hex)

    # Part-number strip
    strip_h = 56
    draw.rectangle([0, size - strip_h, size, size], fill=hex_to_rgb(accent_hex))
    if product.part_number:
        draw.text((size // 2 - len(product.part_number) * 4, size - strip_h + 18),
                  product.part_number, fill=(255, 255, 255))

    draw.rectangle([0, 0, size-1, size-1], outline=hex_to_rgb(icon_hex), width=2)
    return _save_jpeg(img)


def variant_white_closeup(product, size=600):
    """White background, larger icon — clean catalogue shot."""
    cat_slug = product.category.slug if product.category else ''
    bg_hex, accent_hex, icon_hex = CATEGORY_THEME.get(cat_slug, DEFAULT_THEME)

    img = _base_image((255, 255, 255), size)
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2

    # Subtle light tinted circle
    r_circle = int(size * 0.42)
    tint = clamp_rgb(lighten(hex_to_rgb(bg_hex), 1.03))
    draw.ellipse([cx-r_circle, cy-r_circle, cx+r_circle, cy+r_circle], fill=tint)

    drawer = ICON_DRAWERS.get(cat_slug, DEFAULT_ICON)
    drawer(draw, cx, cy, int(size * 0.34), accent_hex, icon_hex)

    # Thin border
    draw.rectangle([0, 0, size-1, size-1], outline=hex_to_rgb(accent_hex), width=3)
    return _save_jpeg(img)


def variant_dark_studio(product, size=600):
    """Dark charcoal background — premium studio feel."""
    cat_slug = product.category.slug if product.category else ''
    bg_hex, accent_hex, icon_hex = CATEGORY_THEME.get(cat_slug, DEFAULT_THEME)
    accent_rgb = hex_to_rgb(accent_hex)

    # Tinted dark background (slight hue from accent color)
    dark_bg = clamp_rgb(tuple(15 + int(c * 0.10) for c in accent_rgb))

    img = _base_image(dark_bg, size)
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2

    # Slightly lighter circle
    circle_fill = clamp_rgb(tuple(c + 18 for c in dark_bg))
    r = int(size * 0.40)
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=circle_fill)

    # Brighter accent for visibility on dark
    bright_accent = rgb_to_hex(clamp_rgb(tuple(min(255, int(c * 1.35)) for c in accent_rgb)))
    bright_icon = rgb_to_hex(clamp_rgb(tuple(min(255, int(c * 1.35)) for c in hex_to_rgb(icon_hex))))

    drawer = ICON_DRAWERS.get(cat_slug, DEFAULT_ICON)
    drawer(draw, cx, cy, int(size * 0.28), bright_accent, bright_icon)

    # Accent border glow effect (two rectangles)
    glow = clamp_rgb(tuple(min(255, int(c * 0.6)) for c in accent_rgb))
    draw.rectangle([0, 0, size-1, size-1], outline=glow, width=4)
    draw.rectangle([6, 6, size-7, size-7], outline=glow, width=1)

    return _save_jpeg(img)


def variant_angled(product, size=600):
    """Standard view rotated 12° — angle/perspective shot."""
    cat_slug = product.category.slug if product.category else ''
    bg_hex, accent_hex, icon_hex = CATEGORY_THEME.get(cat_slug, DEFAULT_THEME)
    bg_rgb = hex_to_rgb(bg_hex)

    # Build inner icon layer on RGBA
    inner = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw_inner = ImageDraw.Draw(inner)
    cx = cy = size // 2

    # Background circle
    r_bg = int(size * 0.36)
    circle_fill = clamp_rgb(darken(bg_rgb)) + (255,)
    draw_inner.ellipse([cx-r_bg, cy-r_bg, cx+r_bg, cy+r_bg], fill=circle_fill)

    drawer = ICON_DRAWERS.get(cat_slug, DEFAULT_ICON)
    drawer(draw_inner, cx, cy, int(size * 0.26), accent_hex, icon_hex)

    # Rotate the icon layer
    rotated = inner.rotate(12, resample=Image.BICUBIC, expand=False)

    # Compose onto background
    bg_img = _base_image(bg_rgb, size)
    bg_img.paste(rotated, (0, 0), rotated)

    draw_final = ImageDraw.Draw(bg_img)
    draw_final.rectangle([0, 0, size-1, size-1], outline=hex_to_rgb(icon_hex), width=2)

    return _save_jpeg(bg_img)


def variant_tinted(product, size=600):
    """Accent-tinted background — bold colour variant."""
    cat_slug = product.category.slug if product.category else ''
    bg_hex, accent_hex, icon_hex = CATEGORY_THEME.get(cat_slug, DEFAULT_THEME)
    accent_rgb = hex_to_rgb(accent_hex)

    # Pastel tinted background from accent
    tinted_bg = clamp_rgb(tuple(200 + int(c * 0.22) for c in accent_rgb))

    img = _base_image(tinted_bg, size)
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2

    # Slightly more opaque circle
    circle_fill = clamp_rgb(darken(tinted_bg, 0.93))
    r = int(size * 0.38)
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=circle_fill)

    # Slightly darker icon so it contrasts on the tinted bg
    dark_accent = rgb_to_hex(clamp_rgb(darken(accent_rgb, 0.75)))
    dark_icon = rgb_to_hex(clamp_rgb(darken(hex_to_rgb(icon_hex), 0.75)))

    drawer = ICON_DRAWERS.get(cat_slug, DEFAULT_ICON)
    drawer(draw, cx, cy, int(size * 0.27), dark_accent, dark_icon)

    draw.rectangle([0, 0, size-1, size-1], outline=hex_to_rgb(dark_accent), width=2)
    return _save_jpeg(img)


VARIANT_FNS = [
    variant_standard,      # 0 — always main
    variant_white_closeup, # 1 — always included
    variant_dark_studio,   # 2 — always included
    variant_angled,        # 3 — always included
    variant_tinted,        # 4 — optional (50 % chance)
]


class Command(BaseCommand):
    help = 'Generate 4-5 sample product images per product'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Regenerate even if images already exist')

    def handle(self, *args, **options):
        products = Product.objects.select_related('category').prefetch_related('images').filter(is_active=True)
        created = skipped = 0

        for product in products:
            if product.images.exists() and not options['force']:
                self.stdout.write(f'  skip  id={product.pk} [{product.slug}]')
                skipped += 1
                continue

            if options['force']:
                product.images.all().delete()

            slug_short = product.slug[:28]

            # Always generate variants 0-3; add variant 4 randomly
            indices = list(range(4))
            if random.random() < 0.5:
                indices.append(4)

            for order, idx in enumerate(indices):
                fn = VARIANT_FNS[idx]
                buf = fn(product)
                suffix = ['main', 'white', 'dark', 'angle', 'tint'][idx]
                filename = f'product_{product.pk}_{slug_short}_{suffix}.jpg'
                pi = ProductImage(
                    product=product,
                    alt=f'{product.name}',
                    is_main=(order == 0),
                    order=order,
                )
                pi.image.save(filename, ContentFile(buf.read()), save=True)

            count = len(indices)
            self.stdout.write(self.style.SUCCESS(f'  OK ({count} imgs)  id={product.pk} [{product.slug}]'))
            created += 1

        self.stdout.write(self.style.SUCCESS(f'\nDone. Products updated: {created}, Skipped: {skipped}'))
