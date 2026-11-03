# گزارش نتیجهٔ بازطراحی skill-guided

**وضعیت نهایی: منتشرشده و بررسی‌شده.** هر ۴۸ تست پاس شد؛ deployment همان پروژهٔ Vercel در وضعیت READY است.  
**شواهد خصوصی:** `C:/Users/yazda/Documents/PORTFOLIO_DESIGN_DIGEST/skill-overhaul-20261103/{responsive-evidence.json,interaction-evidence.json}`؛ فایل‌های خصوصی و screenshotها بیرون Git باقی مانده‌اند.

## نتیجهٔ مرورگر محلی

فایل responsive شامل **۸۰ مشاهده: ۱۶ طرح × ۵ عرض اسمی** ۳۲۰، ۳۹۰، ۷۶۸، ۱۰۲۴ و ۱۴۴۰ پیکسل است. عرض محتوای اندازه‌گیری‌شده به‌ترتیب ۳۰۵، ۳۷۵، ۷۵۳، ۱۰۰۹ و ۱۴۲۵ پیکسل بود. در نتیجهٔ نهایی هر ۸۰ مورد، `scrollWidth` با عرض اندازه‌گیری‌شده برابر است؛ overflow افقی و `nameOverflow` صفر است. هر ردیف ۱۱ بخش، یک h1، ۸۷ پروژه و portrait با اندازهٔ گزارش‌شدهٔ ۷۲۰ پیکسل دارد. حالت حرکت این ماتریس `spatial` است.

در اجرای اولیهٔ عرض ۳۲۰، ۱۵ طرح غیر-unified به‌علت ۲ پیکسل خروج navigation از عرض محتوا داشتند. عرض navigation اصلاح شد و ردیف‌های نهایی هر ۱۶ طراحی در پنج عرض پاس شدند.

تعامل‌هایی که شاهد مشخص دارند:

- Gallery با ۱۵ کارت در پنج عرض اسمی، اندازه‌های `clientWidth / scrollWidth` برابر ۲۶۸، ۳۳۸، ۶۹۸، ۹۵۲ و ۱۱۰۳ داشت. فیلد جست‌وجو/فیلتر ۱۶px است و هنگام native modal، `html` حالت overflow مخفی داشت. Escape اول query تایپ‌شده را پاک می‌کند؛ Escape بعدی از دکمه dialog را می‌بندد و focus را به opener بازمی‌گرداند.
- Modal پروژه در عرض موبایل ۳۲۰ پیکسل با `scrollWidth` برابر ۳۲۰ و فونت متن ۱۶px باز شد؛ Escape آن را بست و focus بازگشت.
- Modal مدرک ۳۳۵ پیکسل عرض داشت و تصویر منبع با عرض طبیعی ۱۲۴۰ پیکسل بارگذاری شد.
- Story دستی، ۷۲ vertex ثابت، endpoint کد در progress=1 و تغییر geometry را نشان داد؛ هر سه فصل خوانا ماندند.
- Still با `effects=off` تصویر atmosphere را متوقف کرد. در همان مشاهده، `prefers-reduced-motion` سیستم فعال نبود؛ پس این شاهد آزمون واقعی OS Reduced Motion نیست.
- طبق مشاهدهٔ مرورگری ثبت‌شده توسط هماهنگ‌کننده، آرشیو ۲۰ Hero انتخاب و عکس داشت، BioTeal edition یازده بخش و ۸۷ پروژه/عکس ۷۲۰px داشت و کتابخانهٔ ایده ۳۵۰ مورد حفظ شد. این فیلدها در به‌روزرسانی `interaction-evidence.json` نیز ثبت شده‌اند.

## Skillها و روش اجراشده

Manifest `docs/design/skill-audit/INSTALLATION.json` نصب/اعتبارسنجی ۵۲۸ skill پروژه‌ای و ۴۱۸۶ فایل در `.agents/skills` را ثبت می‌کند؛ این عدد ادعای خواندن یا اجرای همهٔ ۵۲۸ skill نیست. گزارش [بازبینی motion](./MOTION_OVERHAUL_REVIEW_FA.md) می‌گوید متن و companionهای ۱۶ skill از نسخهٔ ثابت Emil بررسی شده‌اند؛ [نقد مستقل](./OVERHAUL_CRITIQUE_FA.md) منشأ دیگر اصول طراحی/دسترس‌پذیری/ریتم را ثبت می‌کند.

موارد مرتبطی که در manifest مسیر واقعی دارند: `od-frontend-design`, `od-ui-animation`, `emil-animate`, `emil-review-animations`, `emil-improve-animations`, `emil-animation-performance`, `emil-mobile-native`, `trystan-design-system-extract`, `trystan-accessibility-audit`, `trystan-hierarchy-rhythm-review` و `trystan-interaction-states-pass`. اصول کاربردی شامل سلسله‌مراتب مخصوص محصول، خوانایی/فاصله، توکن مشترک، حرکت هدفمند و قطع‌پذیر، reduced motion، keyboard/focus، ورودی ۱۶px و کنترل‌های موبایل است. vendor code اجرا و package نصب نشد؛ global config و browser bundle تغییر نکردند.

سوپرپرامپت اجرایی و plan مرحله‌ای در [SKILL_OVERHAUL_SUPERPROMPT_FA.md](./SKILL_OVERHAUL_SUPERPROMPT_FA.md) و [SKILL_OVERHAUL_PLAN_FA.md](./SKILL_OVERHAUL_PLAN_FA.md) ذخیره شده‌اند. شواهد واقعی شامل بازبینی سلسله‌مراتب/پالت، سیستم motion و این اجراهای مرورگر است؛ سند prompt به‌تنهایی شاهد موفقیت محسوب نمی‌شود.

## تست‌ها، خطا و حدود شواهد

- اجرای نهایی `npm test`: **۴۸ تست موفق، صفر شکست**. انتظار اشتباه در تست متن گالری در اجرای مقدماتی اصلاح و سپس کل مجموعه دوباره اجرا شد.
- تب مرورگر تازه پس از معتبرشدن asset نهایی، صفر خطای console داشت. تب قدیمی‌تر یک SyntaxError تاریخی در 04:00:19 نگه داشته بود که پیش از اصلاح فایل بود؛ بنابراین عبارت «هیچ‌وقت خطا نداشت» نادرست است.
- Actual OS reduced-motion، browserهای متعدد، گوشی واقعی و FPS/performance profile آزموده نشده‌اند. ماتریس ۸۰تایی فقط layout در حالت spatial را پوشش می‌دهد؛ حاصل ضرب کامل تم/حرکت/طرح نیست.
- هیچ امتیاز عددیِ خودساخته‌ای برای «کیفیت طراحی» داده نمی‌شود.

## انتشار

commit `13746dbd72abac52c66d6aff6099d12d504d519e` و deployment `dpl_EAA981zHCcaQq29desMM73xxe5du` با وضعیت READY روی همان پروژه منتشر شدند. هر ۵۷ فایل عمومی با نسخهٔ محلی تطبیق داشت؛ API ناشناس 401 و private/no-store باقی ماند. در production تعویض unified به Kinetic و حفظ rotate پرتره، گالری، عرض ۳۹۰ اسمی بدون overflow و story با progress=1، ۷۲ رأس و stageTop=92 مشاهده شد؛ تب تازه خطای کنسول نداشت. خروجی نهایی روی unified/light/silk و کل سایت قرار گرفت.

خلاصهٔ ماشینی، مرزهای evidence و وضعیت release در [SKILL_OVERHAUL_RESULTS.json](./SKILL_OVERHAUL_RESULTS.json) قرار دارد.


## اصول واقعاً به‌کاررفته

- OpenDesign و CDS: هویت ژورنال علمی، سلسله‌مراتب ۱۱ بخش و حفظ ترکیب مستقل ۱۵ طرح، در `craft.css`.
- OpenCowork (`ocd-craft-polish`, `ocd-responsive-layout`, `ocd-surface-elevation`): اصلاح wrap و انتخاب، کنترل‌های موبایل و سایهٔ دو لایه.
- Emil و Impeccable: یک ورود محدود و قابل قطع، فیلتر فوری، lifecycle و مسیر Still، در `motion-system.*`.
- iart (`motion-art-direction`, `color-motion`, `shot-composition`): تفکیک نقش صحنه/متن/بک‌گراند، پالت محدود، وزن کمتر محیط، بازچینی موبایل و material ملایم در story؛ کد renderer/فیلم vendor استفاده نشد.
- Trystan: نقد سلسله‌مراتب، وضعیت تعامل و کنتراست با شاهد و اصلاح یافته‌ها، در `OVERHAUL_CRITIQUE_FA.md`.

این‌ها استفاده از اصول و متن اسکیل‌اند، نه ادعای اجرای برنامهٔ خودکار vendor. منابع حجیم و ۴۱۸۶ فایل نصب‌شده محلی و Git-ignored هستند؛ provenance و کاربرد پیشنهادی همهٔ ۵۲۸ ورودی در manifest نگه داشته شده‌اند. در اسکن نهایی release candidate، هیچ مقدار فعلی env پیدا نشد.


## بازبینی checkpoint درخواست تکرارشده

در ۳ نوامبر ۲۰۲۶، هر ۵۲۸ entrypoint و تمامیت ۴۱۸۶ فایل دوباره بررسی شد؛ همان deployment هنوز READY بود. پوشش ۱۳ URL و سازگاری plan/prompt به‌طور مستقل مرور شد. جمله‌های قدیمیِ «تست/انتشار در انتظار است» در گزارش ماشینی و BUILD_PROGRESS اصلاح شدند. ابزار `--verify-only` هم اصلاح شد تا نصب‌نامه را بازنویسی نکند: اجرای واقعی با exit=0 و ۵۳۰ فایل گزارش/provenance با hash و mtime یکسان قبل و بعد تمام شد. این نوبت کد عمومی سایت، طراحی یا نصب بسته‌ها تغییری نکرد؛ شواهد بصری و ۴۸ تست مربوط به اجرای ثبت‌شدهٔ پیشین‌اند.
