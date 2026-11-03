# پنج جهان مستقل: Workbench، Signal، Connectome، Shell، Draft

این بسته فقط مالک `public/portfolio/directions/systems.js`، `systems.css` و همین سند است. رجیستری، runtime، کیت اتم‌های داده، بارگذاری فونت و انتشار به هماهنگ‌کننده تعلق دارد. راهنمای طراحی نصب‌شدهٔ `od-frontend-design`، ماتریس `INDEPENDENT_DIRECTIONS_PLAN_FA.md` و قرارداد `PORTFOLIO_CONTRACT.md` خوانده شدند. از `od-industrial-brutalist-ui` برای تفکیک پوستر سوئیسی از متن ترمینال و از `od-minimalist-ui` برای نظم سند و disclosure استفاده شد؛ انتخاب متریال و رفتار دقیق تابع ماتریس پروژه است.

## اثر انگشت ترکیب‌ها

| جهت | ترکیب و تایپ | ماده و پرتره | پروژه و تجربه | ناوبری و حرکت |
|---|---|---|---|---|
| Workbench | محیط سه‌ناحیه‌ای explorer، سند و inspector؛ grotesk برای سند و mono برای chrome | زغالی، سطوح فرورفته و خطوط editor؛ تصویر واقعی در inspector | هر پروژه تب عنوان، preview و سند دو‌بخشی دارد؛ تجربه changelog با ریل دوره | لینک‌های واقعی explorer و تب سند؛ feedback فوری hover و disclosure، بدون دکمهٔ ساختگی پنجره |
| Signal | پوستر با نام عظیم در نوار مستقل، index و عکس در ستون‌های سخت؛ Space Grotesk فشرده | کاغذ سفید، کبالت و خط ضخیم؛ تصویر مستطیلی در ستون | دو ستون پلاک تایپوگرافیک با شمارهٔ بزرگ؛ تجربه schedule افقی | index شماره‌دار و نوار مقصد؛ تنها حرکت loop روی راهنمای تزئینی زیر نام |
| Connectome | نقشهٔ باز با پرترهٔ مرکزی و چهار satellite؛ شرح هویت بیرون نقشه | زمینهٔ روشن اطلس، اتصال‌های ظریف و رنگ نقش‌های category؛ تصویر دایره‌ای | پروژه‌ها روی spine با junction شماره‌دار و preview جانبی؛ تجربه شاخه‌هایی با annotation دوره | nodeها لینک واقعی بخش‌اند؛ category و شمارش مستقیماً از مدل؛ pulse فقط روی اتصال تزئینی |
| Shell | خروجی متن تک‌جریان، پرترهٔ پیوست کوچک؛ IBM Plex Mono در همهٔ سطوح | زمینهٔ مات و فسفر کم‌اشباع؛ بدون پنجره، inspector، تب یا preview گالری | هر پروژه disclosure بومی با متن کامل؛ تجربه log سادهٔ متن | لینک فرمان‌مانند به anchor واقعی، بدون input فرمان یا کنترل اجرا؛ cursor صرفاً تزئینی |
| Draft | شیت کادرکشی با dimension بالایی، ریل اندازه‌گذاری تصویر و title block؛ Barlow Condensed و mono | آبی نقشه، خطوط باریک و grid کوچک؛ پرترهٔ واقعی با crosshair گوشه‌ها | schedule سه‌ستونهٔ شماره/ترسیم/مشخصات؛ تجربه ریل E و شیت متن | register شمارهٔ شیت، annotation و disclosure؛ متن ثابت و بدون loop |

Signal عمداً خط درشت و سطح تخت دارد؛ grid ترسیم، dimension و crosshair فقط در Draft هستند. Shell عمداً جریان تک‌ستونی و متن کامل دارد؛ chrome سه‌ناحیه‌ای، preview و inspector فقط در Workbench هستند. خطوط Connectome صرفاً مسیر ناوبری‌اند؛ هیچ ارتباط زیستی، رابطهٔ پژوهشی یا graph استنتاج‌شده‌ای ادعا نمی‌شود.

## هفت بخش رکورد

- Workbench: publications و education با gutter شمارهٔ سند؛ credentials با preview و متن کنار هم؛ زبان‌ها دو ستون پنجره‌ای؛ skills با زیرگروه‌های دو‌ستونه؛ reference مانند inspector متنی؛ contact شبکهٔ دو‌ستونهٔ اطلاعات.
- Signal: publications با شمارهٔ عظیم؛ education با نوار عمودی ضخیم؛ credentials سه ستون چاپی؛ languages schedule تک‌ردیفی؛ skills ستون‌های زیرگروه چاپی؛ references نام و فراداده کنار هم؛ contact پوستر کبالت با نام درشت.
- Connectome: publications و education شاخه‌های index؛ skills درخت زیرگروه و خط اتصال؛ credentials گره‌های گوشه‌دار؛ languages branch با برچسب رنگی؛ references disclosure روی ریل؛ contact آخرین node از مسیر.
- Shell: همهٔ فهرست‌ها تک‌ستونی و خط‌چین؛ credential preview تزئینی مخفی و تمام متن و لینک واقعی باقی است؛ skills فهرست متن ساده؛ reference تماس را پشت disclosure نگه می‌دارد؛ contact خروجی لینک متنی.
- Draft: publications و education schedule با ستون شماره؛ skills جدول مشخصات داخلی؛ credentials ترسیم و متن کنار هم؛ languages ریل عنوان؛ references مشخصات پشت disclosure؛ contact title block کادرشده.

هر ۱۱ renderer برای هر جهت ثبت شده است. هفت renderer رکورد از `PortfolioDirectionKit.records` فقط اتم داده و hook مشترک می‌گیرند؛ چیدمان و متریال با scope همان جهت تعیین می‌شود. هیچ renderer از hero، about، projectCollection یا experienceRows مطالعه‌های قبلی استفاده نمی‌کند.

## داده، دسترس‌پذیری و مرز اعتبار

همهٔ projectها و experienceها در ترتیب منبع و با شناسهٔ canonical در markup نگه داشته می‌شوند. متن شخصی با `h.e` و مقصد خارجی با `h.link` از اتم مشترک تولید می‌شود. خلاصهٔ کوتاه هیرو به biography کامل ارجاع می‌دهد و متن کامل پروژه در modal مشترک در دسترس است؛ Shell متن کامل را در disclosure هم دارد. هیچ count فایل، نتیجهٔ علمی، سطح مهارت، کارفرما یا ادعای availability ساخته نشده است. تصویر واقعی توسط helper معتبر تولید می‌شود. شمارش‌های hero صرفاً طول آرایه‌های واقعی‌اند؛ شمارهٔ P/E یا index، شمارهٔ ارائه است.

CSS تم روشن و تیرهٔ هر جهت را مستقل تعریف می‌کند؛ `--on-accent` برای خوانایی نوارها و دکمه‌ها تنظیم شده است. breakpointهای ۱۱۰۰، ۸۰۰ و ۵۶۰ برای stacking و intrinsic sizing نوشته شده‌اند؛ کنترل‌ها حداقل ۴۴ پیکسل و متن دارای wrap است. فرم جستجو، فیلتر، صفحه‌بندی، modal، copy citation و disclosureها از hook واقعی runtime استفاده می‌کنند. Lock، theme، View options و focus section حذف یا پنهان نشده‌اند.

سه loop تزئینی تنها تحت `data-effects=on` فعال‌اند. Still/off، tab مخفی و reduced motion حرکت را می‌بندند. هیچ محتوای خواندنی برای reveal یا motion نامرئی نمی‌شود. تزئین‌ها دادهٔ علمی نیستند و در نقشه توضیح صریح وجود دارد.

## شواهد و ریسک باقی‌مانده

`node --check public/portfolio/directions/systems.js` در این واگذاری با exit code 0 پاس شد. مرورگر، screenshot، مقایسهٔ ۱۵ جهت، کیفیت فونت و بررسی ۳۲۰/۳۹۰/۷۶۸/۱۰۲۴/۱۴۴۰، تست رفتار runtime و انتشار جزو مسئولیت هماهنگ‌کننده‌اند و در این سند **NOT_TESTED** هستند. وجود CSS موبایل یا فایل منبع شاهد پاس‌شدن این gateها نیست.

ریسک اصلی ادغام، specificity سبک‌های قدیمی در برابر scope جدید و طول عنوان/متن واقعی است. font fallback و متن با طول زیاد عمداً wrap می‌شوند اما شکل نهایی باید دیده شود. رندر و کامل‌بودن فیلدهای هفت بخش به کیت مشترک وابسته است؛ بازبینی اولیهٔ کیت موارد `cefr || level`، shortName/tags مهارت، truthy بودن صفر در GPA/score max و نمایش DOI را برای هماهنگ‌کننده گزارش کرد. رفع آن‌ها در فایل مشترک به مالک کیت تعلق دارد.


## بازبینی هماهنگ‌کننده پس از ادغام

وضعیت‌های NOT_TESTED بالا مربوط به تحویل اولیهٔ عامل‌اند. نقد تصویری واقعی، اصلاح‌های پس از رندر، پنج عرض، تست‌ها و انتشار نهایی در [گزارش هماهنگ‌کننده](INDEPENDENT_DIRECTIONS_RESULTS_FA.md) و [شواهد ماشینی](INDEPENDENT_DIRECTIONS_RESULTS.json) ثبت شده‌اند.
