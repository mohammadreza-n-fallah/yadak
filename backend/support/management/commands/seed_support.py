from django.core.management.base import BaseCommand
from support.models import SupportFAQ

FAQS = [
    {
        'question': 'هزینه و زمان ارسال چقدر است؟',
        'answer': 'ارسال سفارش‌ها به سراسر ایران انجام می‌شود و معمولاً ۲ تا ۵ روز کاری زمان می‌برد. '
                  'برای خریدهای بالای ۵۰۰ هزار تومان ارسال رایگان است.',
        'keywords': 'ارسال,پست,هزینه ارسال,زمان ارسال,تحویل,مرسوله',
        'is_suggested': True, 'order': 1,
    },
    {
        'question': 'روش‌های پرداخت چیست؟',
        'answer': 'پرداخت به صورت آنلاین و امن از طریق درگاه زرین‌پال انجام می‌شود و همه‌ی کارت‌های بانکی '
                  'عضو شتاب پشتیبانی می‌شوند.',
        'keywords': 'پرداخت,زرین پال,زرین‌پال,درگاه,کارت,آنلاین,اقساط',
        'is_suggested': True, 'order': 2,
    },
    {
        'question': 'سفارشم به کجا رسیده؟',
        'answer': 'برای پیگیری سفارش، شماره سفارش و شماره موبایلی که موقع ثبت سفارش وارد کرده‌اید را برایم بنویسید '
                  'تا وضعیتش را بررسی کنم. همچنین می‌توانید از صفحه «پیگیری سفارش» استفاده کنید.',
        'keywords': 'پیگیری,سفارش,کجاست,رهگیری,وضعیت سفارش,کد رهگیری',
        'is_suggested': True, 'order': 3,
    },
    {
        'question': 'امکان مرجوع کردن کالا وجود دارد؟',
        'answer': 'بله، کالای سالم و استفاده‌نشده را تا ۷ روز پس از تحویل می‌توانید مرجوع کنید. '
                  'برای قطعات معیوب نیز ضمانت تعویض داریم.',
        'keywords': 'مرجوع,بازگشت,پس دادن,گارانتی,ضمانت,تعویض,معیوب',
        'is_suggested': False, 'order': 4,
    },
    {
        'question': 'قطعات اصل هستند؟',
        'answer': 'بله، روی همه‌ی قطعات ضمانت اصالت کالا داریم و محصولات از منابع معتبر تأمین می‌شوند. '
                  'نوع قطعه (اصلی یا با کیفیت) در صفحه‌ی هر محصول مشخص است.',
        'keywords': 'اصل,اصالت,اورجینال,تقلبی,کیفیت,گارانتی اصالت',
        'is_suggested': False, 'order': 5,
    },
    {
        'question': 'چطور بفهمم این قطعه به خودروی من می‌خورد؟',
        'answer': 'نام و مدل خودرویتان را بنویسید تا قطعات سازگار را پیدا کنم. در صفحه‌ی هر محصول هم بخش '
                  '«خودروهای سازگار» فهرست خودروهای مناسب آن قطعه را نشان می‌دهد.',
        'keywords': 'سازگار,سازگاری,مناسب,میخوره,می خوره,فیت,خودرو',
        'is_suggested': False, 'order': 6,
    },
]


class Command(BaseCommand):
    help = 'ایجاد سوالات متداول پیش‌فرض برای دستیار پشتیبانی'

    def handle(self, *args, **options):
        created = 0
        for item in FAQS:
            obj, was_created = SupportFAQ.objects.update_or_create(
                question=item['question'],
                defaults=item,
            )
            created += int(was_created)
        # ASCII-only output so the Windows cp1252 console never chokes.
        self.stdout.write(self.style.SUCCESS(
            f'Support FAQs ready: {created} created, {len(FAQS) - created} updated.'
        ))
