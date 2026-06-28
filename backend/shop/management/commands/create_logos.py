"""
Generate brand logos and category images.
Run: python manage.py create_logos
     python manage.py create_logos --force
"""
import io
import math
from PIL import Image, ImageDraw, ImageFont
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from shop.models import Brand, Category

W = (255, 255, 255)  # white — used for all icon strokes/fills


# ── helpers ────────────────────────────────────────────────────────────────

def get_font(size, bold=False):
    candidates = [
        r'C:\Windows\Fonts\arialbd.ttf' if bold else r'C:\Windows\Fonts\arial.ttf',
        r'C:\Windows\Fonts\calibrib.ttf' if bold else r'C:\Windows\Fonts\calibri.ttf',
        r'C:\Windows\Fonts\verdanab.ttf' if bold else r'C:\Windows\Fonts\verdana.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold
        else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def centered_text(draw, text, font, cx, cy, color):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw // 2 - bbox[0], cy - th // 2 - bbox[1]), text, fill=color, font=font)


def gradient_image(size, top_rgb, bot_rgb):
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        c = tuple(int(top_rgb[i] + t * (bot_rgb[i] - top_rgb[i])) for i in range(3))
        draw.line([(0, y), (size - 1, y)], fill=c)
    return img


# ──────────────────────────────────────────────────────────────────────────────
# Brand logo generators  (240 × 120 PNG — unchanged)
# ──────────────────────────────────────────────────────────────────────────────

def make_bosch_logo(w=240, h=120):
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    r = int(h * 0.42)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(227, 6, 19))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(180, 0, 0), width=2)
    font = get_font(int(h * 0.27), bold=True)
    centered_text(draw, 'BOSCH', font, cx, cy, W)
    return img


def make_philips_logo(w=240, h=120):
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    blue = (0, 114, 206)
    spacing = int(w * 0.11)
    star_y = int(h * 0.30)
    sr = int(h * 0.13)
    for sx in [cx - spacing, cx, cx + spacing]:
        pts = [(sx, star_y - sr), (sx + sr // 2, star_y),
               (sx, star_y + sr), (sx - sr // 2, star_y)]
        draw.polygon(pts, fill=blue)
    font = get_font(int(h * 0.24), bold=True)
    centered_text(draw, 'PHILIPS', font, cx, int(h * 0.72), blue)
    draw.rectangle([0, h - 6, w, h], fill=blue)
    return img


def make_specter_logo(w=240, h=120):
    img = Image.new('RGB', (w, h), (13, 17, 38))
    draw = ImageDraw.Draw(img)
    cx = w // 2
    red = (233, 69, 96)
    draw.rectangle([int(w * 0.08), int(h * 0.17), int(w * 0.92), int(h * 0.21)], fill=red)
    font = get_font(int(h * 0.29), bold=True)
    centered_text(draw, 'SPECTER', font, cx, int(h * 0.50), W)
    font_sm = get_font(int(h * 0.14), bold=False)
    centered_text(draw, 'AUTO PARTS', font_sm, cx, int(h * 0.75), red)
    draw.rectangle([int(w * 0.08), int(h * 0.83), int(w * 0.92), int(h * 0.87)], fill=red)
    return img


def make_stp_logo(w=240, h=120):
    img = Image.new('RGB', (w, h), (255, 204, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    red = (204, 0, 0)
    stripe = int(h * 0.17)
    draw.rectangle([0, 0, w, stripe], fill=red)
    draw.rectangle([0, h - stripe, w, h], fill=red)
    font = get_font(int(h * 0.50), bold=True)
    centered_text(draw, 'STP', font, cx, cy, red)
    draw.rectangle([2, 2, w - 3, h - 3], outline=red, width=2)
    return img


def make_air_logo(w=240, h=120):
    img = Image.new('RGB', (w, h), (232, 244, 253))
    draw = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    blue = (30, 136, 229)
    r = int(h * 0.42)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=blue)
    for i in range(5):
        y = cy - int(r * 0.44) + i * int(r * 0.22)
        draw.rectangle([cx - int(r * 0.56), y, cx + int(r * 0.56), y + 3], fill=W)
    font = get_font(int(h * 0.34), bold=True)
    centered_text(draw, 'AIR', font, cx, cy, W)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(21, 101, 192), width=3)
    return img


def make_generic_brand_logo(brand, w=240, h=120):
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    r = int(h * 0.40)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(99, 102, 241))
    label = brand.slug.replace('-', ' ').upper()[:8]
    font = get_font(int(h * 0.22), bold=True)
    centered_text(draw, label, font, cx, cy, W)
    return img


BRAND_MAKERS = {
    'bosch':   make_bosch_logo,
    'philips': make_philips_logo,
    'specter': make_specter_logo,
    'stp':     make_stp_logo,
    'air':     make_air_logo,
}


# ──────────────────────────────────────────────────────────────────────────────
# Modern white icon drawers
# All signatures: (draw, cx, cy, r, badge_rgb)
# badge_rgb is the badge fill colour — used to punch holes/cut-outs
# ──────────────────────────────────────────────────────────────────────────────

def icon_brake_disc(draw, cx, cy, r, badge):
    """Ventilated brake disc — ring + 6 holes + inner ring + hub."""
    lw = max(6, r // 9)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=W, width=lw)
    inner = int(r * 0.50)
    draw.ellipse([cx - inner, cy - inner, cx + inner, cy + inner],
                 outline=W, width=max(3, lw // 2))
    hole = max(5, r // 10)
    for a in range(15, 360, 60):
        x = cx + int(r * 0.73 * math.cos(math.radians(a)))
        y = cy + int(r * 0.73 * math.sin(math.radians(a)))
        draw.ellipse([x - hole, y - hole, x + hole, y + hole], fill=W)
    hub = max(5, r // 7)
    draw.ellipse([cx - hub, cy - hub, cx + hub, cy + hub], fill=W)


def icon_gear(draw, cx, cy, r, badge):
    """8-tooth gear with punched centre hole."""
    teeth = 8
    inner = int(r * 0.70)
    pts = []
    for i in range(teeth * 4):
        angle = math.radians(i * 360 / (teeth * 4) - 90)
        rad = r if (i % 4 in (1, 2)) else inner
        pts.append((cx + rad * math.cos(angle), cy + rad * math.sin(angle)))
    draw.polygon(pts, fill=W)
    hole = int(r * 0.30)
    draw.ellipse([cx - hole, cy - hole, cx + hole, cy + hole], fill=badge)
    nub = int(r * 0.10)
    draw.ellipse([cx - nub, cy - nub, cx + nub, cy + nub], fill=W)


def icon_spring(draw, cx, cy, r, badge):
    """Coil spring with flat end-plates."""
    lw = max(5, r // 9)
    top, bot = cy - r, cy + r
    height = bot - top
    coils = 5
    n = coils * 2 + 1
    plate_w = int(r * 0.65)
    # End plates
    for py in [top, bot]:
        draw.rectangle([cx - plate_w, py - lw // 2, cx + plate_w, py + lw // 2], fill=W)
    # Coil zigzag
    prev = None
    for i in range(n):
        t = i / (n - 1)
        y = top + int(t * height)
        x_off = int(r * 0.50 * (1 if i % 2 == 0 else -1))
        pt = (cx + x_off, y)
        if prev:
            draw.line([prev, pt], fill=W, width=lw)
        prev = pt


def icon_lightning(draw, cx, cy, r, badge):
    """Bold lightning bolt."""
    pts = [
        (cx + 16, cy - r),
        (cx - 10, cy - 2),
        (cx + 10, cy - 2),
        (cx - 16, cy + r),
        (cx + 10, cy + 2),
        (cx - 10, cy + 2),
    ]
    draw.polygon(pts, fill=W)


def icon_tyre(draw, cx, cy, r, badge):
    """Tyre with 5-spoke alloy rim."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=W)
    tread = int(r * 0.22)
    rim_r = r - tread
    draw.ellipse([cx - rim_r, cy - rim_r, cx + rim_r, cy + rim_r], fill=badge)
    face_r = int(rim_r * 0.92)
    draw.ellipse([cx - face_r, cy - face_r, cx + face_r, cy + face_r], fill=W)
    hub_r = int(face_r * 0.26)
    draw.ellipse([cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r], fill=badge)
    spoke_w = max(4, int(face_r * 0.12))
    for a in range(0, 360, 72):
        x2 = cx + int(face_r * 0.88 * math.cos(math.radians(a)))
        y2 = cy + int(face_r * 0.88 * math.sin(math.radians(a)))
        x1 = cx + int(hub_r * 1.25 * math.cos(math.radians(a)))
        y1 = cy + int(hub_r * 1.25 * math.sin(math.radians(a)))
        draw.line([x1, y1, x2, y2], fill=W, width=spoke_w)
    cap = int(face_r * 0.14)
    draw.ellipse([cx - cap, cy - cap, cx + cap, cy + cap], fill=W)


def icon_car(draw, cx, cy, r, badge):
    """Minimal car side-profile silhouette."""
    bw = int(r * 1.80)
    bh = int(r * 0.44)
    rh = int(r * 0.42)
    rw = int(bw * 0.50)
    by = cy + int(r * 0.08)          # body-rect top y

    # Body rectangle
    draw.rectangle([cx - bw // 2, by, cx + bw // 2, by + bh], fill=W)

    # Roof trapezoid (slightly forward-biased for sporty look)
    front_off = int(bw * 0.12)
    rear_off  = int(bw * 0.06)
    draw.polygon([
        (cx - bw // 2 + front_off,  by),
        (cx - rw // 2,               by - rh),
        (cx + rw // 2,               by - rh),
        (cx + bw // 2 - rear_off,   by),
    ], fill=W)

    # Wheel arches — punch badge colour into body bottom
    wr = int(bh * 0.70)
    axle_y = by + bh
    for wx in [cx - int(bw * 0.27), cx + int(bw * 0.27)]:
        draw.ellipse([wx - wr, axle_y - wr, wx + wr, axle_y + wr], fill=badge)

    # Wheels (white circles)
    wheel_r = int(wr * 0.68)
    for wx in [cx - int(bw * 0.27), cx + int(bw * 0.27)]:
        draw.ellipse([wx - wheel_r, axle_y - wheel_r,
                      wx + wheel_r, axle_y + wheel_r], fill=W)

    # Windshield (cut out, badge colour)
    ws_bottom = by
    ws_top    = by - rh + int(rh * 0.18)
    ws_left   = cx - rw // 2 + int(rw * 0.06)
    ws_right  = cx
    draw.polygon([
        (ws_left + int(rw * 0.08),  ws_bottom),
        (ws_left,                   ws_top),
        (ws_right,                  ws_top),
        (ws_right + int(rw * 0.04), ws_bottom),
    ], fill=badge)


def icon_alloy_wheel(draw, cx, cy, r, badge):
    """Performance alloy wheel — 5 spokes."""
    # Outer tyre ring
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=W)
    # Tyre gap
    rim_outer = int(r * 0.78)
    draw.ellipse([cx - rim_outer, cy - rim_outer, cx + rim_outer, cy + rim_outer], fill=badge)
    # Rim face
    rim_inner = int(r * 0.70)
    draw.ellipse([cx - rim_inner, cy - rim_inner, cx + rim_inner, cy + rim_inner], fill=W)
    # Centre hole
    hub = int(r * 0.26)
    draw.ellipse([cx - hub, cy - hub, cx + hub, cy + hub], fill=badge)
    # 5 spokes
    sw = max(5, int(rim_inner * 0.14))
    for a in range(0, 360, 72):
        x2 = cx + int(rim_inner * 0.86 * math.cos(math.radians(a)))
        y2 = cy + int(rim_inner * 0.86 * math.sin(math.radians(a)))
        x1 = cx + int(hub * 1.22 * math.cos(math.radians(a)))
        y1 = cy + int(hub * 1.22 * math.sin(math.radians(a)))
        draw.line([x1, y1, x2, y2], fill=W, width=sw)
    cap = int(r * 0.12)
    draw.ellipse([cx - cap, cy - cap, cx + cap, cy + cap], fill=W)


def icon_brake_pad(draw, cx, cy, r, badge):
    """Brake pad — rectangular body, friction strip, mounting holes."""
    pw = int(r * 1.55)
    ph = int(r * 0.90)
    draw.rectangle([cx - pw // 2, cy - ph // 2, cx + pw // 2, cy + ph // 2], fill=W)
    fs = int(ph * 0.28)
    draw.rectangle([cx - pw // 2 + 7, cy + ph // 2 - fs - 7,
                    cx + pw // 2 - 7, cy + ph // 2 - 7], fill=badge)
    hole = max(5, r // 10)
    for bx in [cx - int(pw * 0.30), cx + int(pw * 0.30)]:
        draw.ellipse([bx - hole, cy - ph // 4 - hole,
                      bx + hole, cy - ph // 4 + hole], fill=badge)


# ──────────────────────────────────────────────────────────────────────────────
# Category config: (gradient_top, gradient_bottom, badge_hex, icon_fn)
# ──────────────────────────────────────────────────────────────────────────────

CATEGORY_CONFIG = {
    'tires-wheels':        ('#F8FAFC', '#E2E8F0', '#64748B', icon_tyre),
    'engine-transmission': ('#FFF7ED', '#FFEDD5', '#EA6A0A', icon_gear),
    'brake-system':        ('#FEF2F2', '#FEE2E2', '#EF4444', icon_brake_disc),
    'suspension':          ('#EFF6FF', '#DBEAFE', '#3B82F6', icon_spring),
    'electrical':          ('#FFFBEB', '#FEF3C7', '#F59E0B', icon_lightning),
    'body':                ('#F0FDF4', '#DCFCE7', '#22C55E', icon_car),
    'tires':               ('#F8FAFC', '#F1F5F9', '#475569', icon_tyre),
    'wheel-disks':         ('#F9FAFB', '#F3F4F6', '#6B7280', icon_alloy_wheel),
    'brake-kits':          ('#FEF2F2', '#FEE2E2', '#EF4444', icon_brake_disc),
    'brake-pads':          ('#FEF2F2', '#FEE2E2', '#F87171', icon_brake_pad),
}
DEFAULT_CAT_CONFIG = ('#F8F9FA', '#E9ECEF', '#6366F1', icon_gear)


def make_category_image(cat, size=400):
    top_h, bot_h, badge_h, draw_fn = CATEGORY_CONFIG.get(cat.slug, DEFAULT_CAT_CONFIG)

    top_rgb   = hex_to_rgb(top_h)
    bot_rgb   = hex_to_rgb(bot_h)
    badge_rgb = hex_to_rgb(badge_h)

    # Gradient background
    img  = gradient_image(size, top_rgb, bot_rgb)
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2

    # Outer soft glow  (very light tint of badge colour)
    glow_r = int(size * 0.41)
    glow   = tuple(int(badge_rgb[i] * 0.14 + 255 * 0.86) for i in range(3))
    draw.ellipse([cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r], fill=glow)

    # Inner glow ring  (slightly more saturated)
    mid_r  = int(size * 0.35)
    mid    = tuple(int(badge_rgb[i] * 0.28 + 255 * 0.72) for i in range(3))
    draw.ellipse([cx - mid_r, cy - mid_r, cx + mid_r, cy + mid_r], fill=mid)

    # Badge circle
    badge_r = int(size * 0.30)
    draw.ellipse([cx - badge_r, cy - badge_r, cx + badge_r, cy + badge_r],
                 fill=badge_rgb)

    # White icon
    icon_r = int(size * 0.195)
    draw_fn(draw, cx, cy, icon_r, badge_rgb)

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=93)
    buf.seek(0)
    return buf


# ──────────────────────────────────────────────────────────────────────────────
# Management command
# ──────────────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Generate logos for product brands and images for categories'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true',
                            help='Regenerate even if already present')
        parser.add_argument('--brands-only', action='store_true')
        parser.add_argument('--categories-only', action='store_true')

    def handle(self, *args, **options):
        force    = options['force']
        do_brands = not options['categories_only']
        do_cats   = not options['brands_only']

        if do_brands:
            self.stdout.write('Brands:')
            for brand in Brand.objects.filter(is_active=True):
                if brand.logo and not force:
                    self.stdout.write(f'  skip  {brand.name}')
                    continue
                if force and brand.logo:
                    brand.logo.delete(save=False)
                maker = BRAND_MAKERS.get(brand.slug)
                img   = maker() if maker else make_generic_brand_logo(brand)
                buf   = io.BytesIO()
                img.save(buf, format='PNG')
                buf.seek(0)
                brand.logo.save(f'brand_{brand.slug}.png', ContentFile(buf.read()), save=True)
                self.stdout.write(self.style.SUCCESS(f'  OK    {brand.name}'))

        if do_cats:
            self.stdout.write('\nCategories:')
            for cat in Category.objects.filter(is_active=True):
                if cat.image and not force:
                    self.stdout.write(f'  skip  {cat.name}')
                    continue
                if force and cat.image:
                    cat.image.delete(save=False)
                buf = make_category_image(cat)
                cat.image.save(f'category_{cat.slug}.jpg', ContentFile(buf.read()), save=True)
                self.stdout.write(self.style.SUCCESS(f'  OK    {cat.name}'))

        self.stdout.write(self.style.SUCCESS('\nDone.'))
