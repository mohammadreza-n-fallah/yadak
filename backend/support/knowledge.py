"""Shop knowledge + tool implementations the AI assistant can call.

The same tool functions power two paths:
  1. LLM function-calling (provider returns a tool_call, we execute it here).
  2. The offline keyword fallback (no AI key configured) which calls the
     product search / FAQ matcher directly so the widget is always useful.
"""
from django.conf import settings


# ─────────────────────────── Tool schemas (OpenAI function-calling format) ──

TOOL_SCHEMAS = [
    {
        'type': 'function',
        'function': {
            'name': 'search_products',
            'description': (
                'جستجوی محصولات و قطعات یدکی در انبار فروشگاه بر اساس نام، شماره فنی قطعه، '
                'برند، دسته‌بندی یا نام خودرو. برای هر سوال درباره موجودی، قیمت یا پیشنهاد قطعه '
                'حتماً از این ابزار استفاده کن و قیمت‌ها را از خودت نساز.'
            ),
            'parameters': {
                'type': 'object',
                'properties': {
                    'query': {'type': 'string', 'description': 'عبارت جستجو، نام قطعه، شماره فنی یا نام خودرو'},
                    'category': {'type': 'string', 'description': 'نام یا اسلاگ دسته‌بندی (اختیاری)'},
                    'max_price': {'type': 'number', 'description': 'حداکثر قیمت به ریال (اختیاری)'},
                    'in_stock_only': {'type': 'boolean', 'description': 'فقط کالاهای موجود (اختیاری)'},
                },
                'required': ['query'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'list_categories',
            'description': 'فهرست دسته‌بندی‌های اصلی محصولات فروشگاه را برمی‌گرداند.',
            'parameters': {'type': 'object', 'properties': {}},
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_order_status',
            'description': 'وضعیت یک سفارش را با شماره سفارش و شماره موبایل ثبت‌شده استعلام می‌کند.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'order_number': {'type': 'string', 'description': 'شماره سفارش'},
                    'phone': {'type': 'string', 'description': 'شماره موبایل ثبت‌شده روی سفارش'},
                },
                'required': ['order_number', 'phone'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_shop_info',
            'description': 'اطلاعات تماس، ساعات کاری، روش پرداخت و ارسال فروشگاه را برمی‌گرداند.',
            'parameters': {'type': 'object', 'properties': {}},
        },
    },
]


# ─────────────────────────────────────────────────── Tool implementations ──

# Normalize Arabic glyphs to Persian so user input matches the catalog.
_PERSIAN_FIX = str.maketrans({'ي': 'ی', 'ك': 'ک', 'ۀ': 'ه', 'ة': 'ه'})

# Common filler words to drop so a full sentence still finds the right part.
_STOPWORDS = {
    'میخوام', 'می‌خوام', 'میخواهم', 'خواستم', 'دارید', 'دارین', 'داری', 'هست',
    'هستش', 'برای', 'یک', 'یه', 'که', 'از', 'با', 'به', 'رو', 'را', 'قیمت',
    'چنده', 'چقدر', 'چقدره', 'لطفا', 'سلام', 'خوام', 'نیاز', 'دنبال', 'میگردم',
    'می‌گردم', 'موجود', 'هستش؟', 'چیه', 'کنم', 'کنید', 'این', 'اون', 'آن',
}


def _normalize(text):
    return (text or '').translate(_PERSIAN_FIX).strip()


def _tokens(query):
    out = []
    for word in _normalize(query).split():
        word = word.strip('؟?.,!،؛:()[]«»"\'')
        if len(word) >= 2 and word not in _STOPWORDS:
            out.append(word)
    return out


def _product_url(slug):
    base = getattr(settings, 'FRONTEND_URL', '') or ''
    return f'{base.rstrip("/")}/product/{slug}'


def _serialize_product(p):
    short = (p.short_description or p.description or '').strip().replace('\n', ' ')
    return {
        'name': p.name,
        'part_number': p.part_number or None,
        'brand': p.brand.name if p.brand else None,
        'category': p.category.name if p.category else None,
        'price': int(p.price),
        'sale_price': int(p.sale_price) if p.sale_price else None,
        'currency': 'ریال',
        'in_stock': p.stock > 0,
        'stock': p.stock,
        'badge': p.get_badge_display() if p.badge else None,
        'url': _product_url(p.slug),
        'summary': (short[:160] + '…') if len(short) > 160 else short,
    }


def search_products(query='', category=None, max_price=None, in_stock_only=False, limit=6):
    from django.db.models import Q
    from shop.models import Product

    qs = Product.objects.filter(is_active=True).select_related('brand', 'category')
    query = _normalize(query)
    if query:
        # Match ANY meaningful word so full sentences still find the part.
        tokens = _tokens(query) or [query]
        combined = Q()
        for tok in tokens:
            combined |= (
                Q(name__icontains=tok)
                | Q(short_description__icontains=tok)
                | Q(description__icontains=tok)
                | Q(part_number__icontains=tok)
                | Q(brand__name__icontains=tok)
                | Q(category__name__icontains=tok)
                | Q(compatible_vehicles__model__name__icontains=tok)
                | Q(compatible_vehicles__model__brand__name__icontains=tok)
            )
        qs = qs.filter(combined).distinct()
    if category:
        qs = qs.filter(Q(category__slug=category) | Q(category__name__icontains=category))
    if max_price:
        try:
            qs = qs.filter(price__lte=float(max_price))
        except (TypeError, ValueError):
            pass
    if in_stock_only:
        qs = qs.filter(stock__gt=0)

    products = list(qs[:limit])
    return {
        'count': len(products),
        'products': [_serialize_product(p) for p in products],
    }


def list_categories():
    from shop.models import Category
    cats = Category.objects.filter(is_active=True, parent__isnull=True).order_by('order', 'name')[:30]
    return {'categories': [{'name': c.name, 'slug': c.slug} for c in cats]}


def get_order_status(order_number='', phone=''):
    from orders.models import Order
    order_number = (order_number or '').strip()
    phone = (phone or '').strip()
    if not order_number or not phone:
        return {'error': 'برای استعلام سفارش، شماره سفارش و شماره موبایل لازم است.'}
    try:
        order = Order.objects.get(order_number=order_number)
    except Order.DoesNotExist:
        return {'found': False, 'message': 'سفارشی با این شماره پیدا نشد.'}
    if phone not in (order.shipping_phone or ''):
        return {'found': False, 'message': 'شماره موبایل با سفارش همخوانی ندارد.'}
    return {
        'found': True,
        'order_number': order.order_number,
        'status': order.get_status_display() if hasattr(order, 'get_status_display') else order.status,
        'payment_status': order.get_payment_status_display() if hasattr(order, 'get_payment_status_display') else getattr(order, 'payment_status', ''),
        'tracking_code': getattr(order, 'tracking_code', '') or None,
        'total': int(order.total) if getattr(order, 'total', None) is not None else None,
        'created_at': order.created_at.strftime('%Y-%m-%d') if getattr(order, 'created_at', None) else None,
    }


def get_shop_info():
    info = {
        'site_name': 'فروشگاه قطعات خودرو',
        'payment': 'پرداخت آنلاین امن از طریق درگاه زرین‌پال',
        'shipping': 'ارسال به سراسر ایران؛ ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان',
        'returns': 'امکان بازگشت کالای سالم تا ۷ روز پس از تحویل طبق قوانین فروشگاه',
        'authenticity': 'ضمانت اصالت کالا روی همه قطعات',
    }
    try:
        from core.models import SiteSettings
        s = SiteSettings.get_settings()
        info.update({
            'site_name': s.site_name or info['site_name'],
            'phone': s.phone or None,
            'email': s.email or None,
            'address': s.address or None,
            'working_hours': s.working_hours or None,
            'whatsapp': s.whatsapp or None,
            'telegram': s.telegram or None,
            'instagram': s.instagram or None,
        })
    except Exception:
        pass
    return {k: v for k, v in info.items() if v}


TOOL_FUNCTIONS = {
    'search_products': search_products,
    'list_categories': list_categories,
    'get_order_status': get_order_status,
    'get_shop_info': get_shop_info,
}


def execute_tool(name, arguments):
    """Run a tool by name with a dict of arguments. Always returns a
    JSON-serializable dict, never raises."""
    func = TOOL_FUNCTIONS.get(name)
    if not func:
        return {'error': f'ابزار ناشناخته: {name}'}
    if not isinstance(arguments, dict):
        arguments = {}
    try:
        return func(**arguments)
    except TypeError:
        # Model passed unexpected/extra args — retry with only known kwargs.
        import inspect
        allowed = set(inspect.signature(func).parameters)
        clean = {k: v for k, v in arguments.items() if k in allowed}
        try:
            return func(**clean)
        except Exception as exc:  # pragma: no cover - defensive
            return {'error': str(exc)}
    except Exception as exc:  # pragma: no cover - defensive
        return {'error': str(exc)}


# ───────────────────────────────────────────────────────── System prompt ──

def build_system_prompt(voice=False):
    bot_name = getattr(settings, 'SUPPORT_BOT_NAME', 'دستیار هوشمند')
    shop = get_shop_info()
    lines = [
        f'تو «{bot_name}» هستی، دستیار فروش و پشتیبانی آنلاین «{shop.get("site_name", "فروشگاه قطعات خودرو")}»؛ '
        'یک فروشگاه اینترنتی تخصصی قطعات و لوازم یدکی خودرو در ایران.',
        '',
        'وظیفه‌ی تو کمک به مشتری‌ها برای پیدا کردن قطعه‌ی مناسب، پاسخ به سوالات درباره قیمت، '
        'موجودی، سازگاری قطعه با خودرو، نحوه‌ی سفارش، پرداخت، ارسال و پیگیری سفارش است.',
        '',
        'قواعد مهم:',
        '۱) همیشه به زبان فارسی، محترمانه، خودمانیِ مودبانه و کوتاه و کاربردی پاسخ بده.',
        '۲) برای هر سوال درباره‌ی قیمت، موجودی یا پیشنهاد محصول، حتماً ابزار search_products را صدا بزن و '
        'هرگز قیمت یا موجودی را از خودت نساز. اگر محصولی پیدا نشد، صادقانه بگو و جایگزین پیشنهاد بده.',
        '۳) هنگام معرفی محصول، نام، قیمت و لینک محصول را به صورت لینک مارک‌داون مثل [نام محصول](آدرس) بده.',
        '۴) برای وضعیت سفارش از ابزار get_order_status استفاده کن و شماره سفارش و موبایل را از کاربر بپرس.',
        '۵) برای اطلاعات تماس، ساعات کاری، ارسال و پرداخت از get_shop_info کمک بگیر.',
        '۶) اگر سوالی خارج از حوزه‌ی فروشگاه بود، مودبانه کاربر را به موضوع قطعات خودرو هدایت کن.',
        '۷) اگر مطمئن نبودی یا کاربر نیاز به پشتیبانی انسانی داشت، او را به شماره تماس فروشگاه ارجاع بده.',
        '۸) قیمت‌ها به ریال است؛ در صورت لزوم معادل تومانی (تقسیم بر ۱۰) را هم یادآوری کن.',
    ]
    contact = []
    if shop.get('phone'):
        contact.append(f'تلفن: {shop["phone"]}')
    if shop.get('working_hours'):
        contact.append(f'ساعات کاری: {shop["working_hours"]}')
    if shop.get('whatsapp'):
        contact.append(f'واتساپ: {shop["whatsapp"]}')
    if contact:
        lines += ['', 'اطلاعات تماس فروشگاه: ' + ' | '.join(contact)]
    lines += ['', f'روش پرداخت: {shop.get("payment", "")}', f'ارسال: {shop.get("shipping", "")}']
    if voice:
        lines += [
            '',
            '[حالت تماس تلفنی صوتی]',
            'این گفتگو یک تماس صوتی است و پاسخ تو با صدا برای مشتری خوانده می‌شود؛ بنابراین:',
            '- خیلی کوتاه، گرم و محاوره‌ای جواب بده (حداکثر دو یا سه جمله).',
            '- اصلاً از مارک‌داون، ستاره، لینک یا آدرس اینترنتی استفاده نکن چون بد خوانده می‌شوند.',
            '- قیمت‌ها را ساده و کلامی بگو و در صورت امکان معادل تومان را هم بگو.',
            '- اگر محصول مناسبی پیدا شد، نام و قیمتش را بگو و پیشنهاد بده برای ثبت سفارش به سایت مراجعه کنند.',
            '- مثل یک اپراتور پشتیبانیِ واقعی و مودب صحبت کن و در پایان بپرس آیا کمک دیگری لازم است.',
        ]
    return '\n'.join(lines)


# ─────────────────────────────────────────────── Offline keyword fallback ──

GREETINGS = ('سلام', 'درود', 'وقت بخیر', 'hi', 'hello', 'سلام علیکم')


def _faq_match(text):
    from .models import SupportFAQ
    text_low = text.lower()
    best, best_score = None, 0
    for faq in SupportFAQ.objects.filter(is_active=True):
        score = 0
        for kw in (faq.keywords or '').split(','):
            kw = kw.strip().lower()
            if kw and kw in text_low:
                score += 2
        for word in faq.question.lower().split():
            if len(word) > 3 and word in text_low:
                score += 1
        if score > best_score:
            best, best_score = faq, score
    return best if best_score >= 2 else None


def offline_reply(text, voice=False):
    """A useful response without any LLM: greet, match an FAQ, search products,
    or fall back to contact info. Always returns Persian text. When ``voice`` is
    set, the output is spoken-friendly (no markdown/links)."""
    text = (text or '').strip()
    if not text:
        return 'سلام! چطور می‌تونم کمکتون کنم؟ می‌تونید نام قطعه یا خودروتون رو بنویسید.'

    low = text.lower()
    if any(low.startswith(g) or low == g for g in GREETINGS) and len(low) < 25:
        return ('سلام و وقت بخیر! 👋 من دستیار فروشگاه قطعات خودرو هستم. '
                'دنبال چه قطعه‌ای هستید یا خودروتون چیه؟')

    faq = _faq_match(text)
    if faq:
        return faq.answer

    # Looks like a product request → search the catalog.
    result = search_products(query=text, limit=4)
    products = result.get('products', [])
    if products:
        if voice:
            parts = [f'{p["name"]}، {(p["sale_price"] or p["price"])} ریال' for p in products[:3]]
            return ('چند مورد پیدا کردم: ' + '؛ '.join(parts)
                    + '. برای ثبت سفارش می‌تونید به سایت مراجعه کنید. کمک دیگه‌ای لازم دارید؟')
        lines = ['این موارد رو در فروشگاه پیدا کردم:', '']
        for p in products:
            price = p['sale_price'] or p['price']
            stock = 'موجود' if p['in_stock'] else 'ناموجود'
            lines.append(f'• [{p["name"]}]({p["url"]}) — {price:,} ریال ({stock})')
        lines += ['', 'برای دیدن جزئیات بیشتر روی نام محصول بزنید. 😊']
        return '\n'.join(lines)

    shop = get_shop_info()
    phone = shop.get('phone')
    tail = f' یا با شماره {phone} تماس بگیرید.' if phone else '.'
    return ('متوجه درخواست شما شدم. می‌تونید نام دقیق قطعه، شماره فنی یا نام و مدل خودروتون رو بنویسید '
            f'تا دقیق‌تر کمکتون کنم{tail}')


def suggested_questions():
    """Quick-reply chips shown under the greeting."""
    from .models import SupportFAQ
    qs = list(SupportFAQ.objects.filter(is_active=True, is_suggested=True).values_list('question', flat=True)[:6])
    if qs:
        return qs
    return [
        'لنت ترمز برای پراید دارید؟',
        'هزینه و زمان ارسال چقدره؟',
        'سفارشم به کجا رسیده؟',
        'روش‌های پرداخت چیه؟',
    ]
