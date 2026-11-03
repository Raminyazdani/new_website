# نقد مستقل تغییر طراحی — ۳ نوامبر ۲۰۲۶

مبنای این بازبینی source فعلی `craft.css`، integration در `studio-intro.js` و `runtime.js`، خانواده‌های پانزده‌گانه، motion-system و gallery موجود است. معیارها از دستورکارهای واقعاً خوانده‌شدهٔ `design-system-extract`، `accessibility-audit`، `hierarchy-rhythm-review` و `interaction-states-pass` نسخهٔ Codex مخزن Trystan و `animate`، `review-animations`، `animation-performance` و `break-ui` نسخهٔ ثابت Emil گرفته شد. متن کامل و provenance در `docs/design/skill-audit/MOTION_WEB_SOURCES.json` موجود است؛ ابزار host فرضی یا امتیاز سلیقه‌ای استفاده نشده است.

این بازبینی مرورگرِ تحت مالکیت هماهنگ‌کننده را باز نکرده است. layout، focus و feel واقعی بدون مشاهده تأیید نهایی نمی‌شوند.

## یافتهٔ واقعی برحسب اولویت

### P2 — entrance عمومی، چرخش پرترهٔ Kinetic را موقتاً حذف می‌کرد — اصلاح شد

`runtime.js:18` برای heroهای فاقد marker، `h1` و `.dl-portrait` را علامت‌گذاری می‌کند. در `designs/experimental.css:163` پرترهٔ Kinetic از قبل `transform:rotate(3deg)` دارد. keyframe اولیهٔ motion-system فقط `translateY(...)` داشت؛ در نتیجه rotate در طول ورود صفر و در پایان دوباره ۳ درجه می‌شد. این یک تغییر ناخواستهٔ ترکیب‌بندی بود، نه اختلاف سلیقه.

با مجوز هماهنگ‌کننده، فقط module متعلق به این بخش اصلاح شد: transform محاسبه‌شدهٔ هر گروه پیش از شروع همهٔ animationها خوانده و در هر دو keyframe حفظ می‌شود. inline style اصلی، پایان animation و unmount دست‌نخورده می‌مانند. تست regression مستقل برای پرترهٔ دارای rotation اضافه شد. markerهای عمومی هر ۱۵ طرح قابل حفظ‌اند.

شاهد اجرا: `node --test tests/motion-system.test.js` اکنون **۷ تست، ۷ موفق** دارد. تست تازه وجود baseline در هر دو frame و حفظ style پس از finish و cleanup را بررسی می‌کند. این شواهد جای مشاهدهٔ snap/feel واقعی در مرورگر را نمی‌گیرند.

یافتهٔ بازِ قطعی دیگری از source بررسی‌شده ثبت نشد. این جمله به معنی تأیید cross-browser یا تمام حالات صفحه نیست.

## کنتراست واقعی unified

اعداد با محاسبهٔ sRGB relative luminance از hexهای فعلی source محاسبه شدند؛ رنگ screenshot یا حدس چشم مبنا نبوده است. جدول زیر نسبت‌های دقیقِ گرد‌شده برای گزارش را نشان می‌دهد:

| جفت رنگ | روشن | تیره |
| --- | ---: | ---: |
| متن اصلی روی paper | ۱۲٫۷۹۹ | ۱۶٫۱۰۲ |
| muted روی paper | ۵٫۸۷۵ | ۹٫۸۵۷ |
| muted روی surface | ۵٫۴۳۹ | ۸٫۶۵۶ |
| muted روی surface-strong | ۵٫۰۲۳ | ۷٫۰۵۰ |
| accent روی paper | ۶٫۵۶۳ | ۱۰٫۵۲۵ |
| coral روی paper | ۶٫۱۰۱ | ۱۰٫۲۴۸ |
| متن on-accent روی CTA اصلی | ۶٫۶۹۲ | ۹٫۶۶۳ |

در `craft.css` رنگ CTA `.st-primary` صریحاً از `--on-accent` استفاده می‌کند. جفت واقعی روشن `#ffffff / #175e9f` و تیره `#0c2030 / #9acbf4` است. نقص کنتراست متن در این جفت‌ها پیدا نشد.

همچنین تعریف tokenهای unified و هر ۱۵ خانواده در هر دو theme از source استخراج شد. سه جفت `on-accent/lime`، `text/paper` و `muted/paper` برای همهٔ ۳۲ ترکیب بالای ۴٫۵ بودند. این بررسی محدود به این جفت‌هاست و به معنای تأیید هر gradient، overlay، placeholder یا حالت disabled در صفحه نیست.

### border قوی‌تر: تصمیم اختیاری برای وضوح، نه اثبات نقض قبلی

در مرور نخست، نسبت کم `--line` به‌اشتباه می‌توانست به‌عنوان نقض قطعی کنترل‌ها تفسیر شود. متن اصلی [W3C SC 1.4.11، بخش Boundaries](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html#boundaries) روشن می‌کند که اگر متن یا icon پرکنتراست وجود کنترل را مشخص کند، داشتن مرز ۳:۱ الزام همگانی نیست. search موجود icon/placeholder و select فلش قابل تشخیص دارند؛ بنابراین نسبت کم مرز به‌تنهایی یک blocker اثبات‌شده نبود. این مورد پیش از تصمیم نهایی اصلاح و از فهرست bug قطعی خارج شد.

هماهنگ‌کننده با این حال token مستقل `--control-line` را برای وضوح بیشتر انتخاب کرد؛ dividerهای تزئینی حفظ شدند. نسبت رنگ‌های جدید:

| theme و control-line | paper | surface | surface-strong |
| --- | ---: | ---: | ---: |
| روشن، `#6a8294` | ۳٫۹۳۵ | ۳٫۶۴۳ | ۳٫۳۶۴ |
| تیره، `#658aa4` | ۴٫۹۳۰ | ۴٫۳۲۹ | ۳٫۵۲۶ |

این تغییر در scope unified و مرز wrapper جست‌وجو/input/select است. border داخلیِ صفرِ input داخل wrapper نباید صرفاً برای اضافه‌کردن token دوباره فعال شود.

## بررسی invariance و integration

- پالت‌های تازهٔ craft به `body[data-design="unified"]` محدودند؛ overwrite متغیرهای paper/ink/accent هیچ‌یک از ۱۵ طرح دیگر در این فایل پیدا نشد. typography و فاصله‌های مشترکِ محدود تغییر کرده‌اند؛ مرورگر همچنان باید overflow طولانی را بررسی کند.
- `data-effects` و `data-motion` پیش از `PortfolioMotion.mount()` در render نهایی set می‌شوند؛ `sync()` انتهای updateMotion و `unmount()` پیش از پاکسازی lock اضافه شده‌اند. فایل جدید قبل از runtime و CSS پس از خانواده‌ها/gallery بارگذاری می‌شود.
- mount تکراری ابتدا instance قبلی را cleanup می‌کند. hidden، Still/off، keyboard و unmount animation و pending entrance را لغو می‌کنند. filter نتایج و گام سریع طرح entrance اضافه ندارند.
- snapshot تازه از `vm.stats.projects/experience` و شرط عدد finite ساخته می‌شود؛ عدد ساختگی یا مهارت‌سنجی از تعداد record استخراج نشده است. لینک‌ها به sectionهای واقعی می‌روند.
- برای craft/motion framework، فونت CDN، بستهٔ runtime یا asset بیرونی جدید اضافه نشده است. referenceهای پژوهش خارج Git‌اند و به صفحهٔ عمومی ارسال نمی‌شوند.
- تغییرات story در craft فقط ظاهر stage/خطوط/typography را دربرمی‌گیرد؛ geometry و timestamp/RAF سیاست تازه‌ای از این stylesheet ایجاد نمی‌شود. drop-shadow روی SVG متحرک می‌تواند هزینه داشته باشد، اما بدون trace این را dropped-frame قطعی نمی‌نامیم.

## gallery و موارد در انتظار شواهد مرورگر

در زمان این snapshot، `design-gallery.js/css` هنوز نسخهٔ موجودِ مبتنی بر layout sketch بود و تغییر تازه‌ای در Git status آن‌ها دیده نشد. بنابراین تبدیل gallery به preview واقعی یا تغییرات بعدی آن در این گزارش تأیید نشده است. باید بعد از رسیدن نسخهٔ جدید جداگانه بررسی شود.

gateهای باز برای هماهنگ‌کننده: تمام ۱۵ طرح در روشن/تیره و ۳۲۰px/zoom، کنتراست surfaceهای ترکیبی، studio/project close در موبایل، dialog rapid reopen/Escape/focus restoration، Full در Reduced Motion و Still، لغو حرکت هنگام lock/hidden، و profile واقعی هزینهٔ SVG/drop-shadow. شواهد source و هفت unit test اجازهٔ حذف این gateها را نمی‌دهند.
