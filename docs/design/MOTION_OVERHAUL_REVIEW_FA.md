# بازبینی تغییر حرکت — ۳ نوامبر ۲۰۲۶

این بخش سه فایل جدید دارد: `public/portfolio/motion-system.js`، `public/portfolio/motion-system.css` و `tests/motion-system.test.js`. فایل‌های موجود برنامه، persistence، داده و geometry تغییر نکرده‌اند. نصب skill نیز توسط این بخش انجام نشده است.

مبنای خوانده‌شدهٔ واقعی، تمام ۱۶ skill و companionهای نسخهٔ ثابت Emil است؛ خصوصاً `animate/SKILL.md` و `RECIPES.md`، `review-animations/SKILL.md` و `STANDARDS.md`، `find-animation-opportunities/SKILL.md`، `animation-performance/SKILL.md` و `mobile-native/SKILL.md`. نسخهٔ کامل محلی در `C:/Users/yazda/Documents/PORTFOLIO_DESIGN_DIGEST/skill_sources_20261103/web/emilkowalski__skills/skills/` و provenance در `docs/design/skill-audit/MOTION_WEB_SOURCES.json` ثبت است. commit مبنا `f1090bec277140d02ed202440185ad9d02ac1490` است.

## تصمیم‌های اجراشده و محدودیت‌ها

| پیش از تغییر | لایهٔ جدید | دلیل و هزینه |
| --- | --- | --- |
| timing پراکنده و easing پیش‌فرض | tokenهای ۱۶۰ms، سطح ۲۲۰ms، خروج ۱۶۰ms و ease-out مشترک | پاسخ هماهنگ؛ فعلاً کل stylesheetهای قدیمی بازنویسی نشده‌اند |
| gallery portrait hover بدون capability gate | حالت ثابت پیش‌فرض؛ حرکت ۲px فقط با hover/fine و حرکت مجاز | حذف sticky hover حرکت‌دار روی touch؛ اندازهٔ قاب و متن ثابت می‌ماند |
| lift معمول button بدون تمایز keyboard | feedback press فقط با آخرین intent اشاره‌گر؛ keyboard/focus فوری | کاربر keyboard منتظر transition نمی‌ماند؛ focus ring موجود حفظ می‌شود |
| native dialog به‌صورت snap | enhancement CSS با `@starting-style`، `display/overlay allow-discrete` و scale محدود `.98` | native method، focus، Escape و semantic close دستکاری نمی‌شود؛ مرورگر فاقد پشتیبانی به رفتار فوری برمی‌گردد |
| dialogهای مختلف امکان ایجاد timerهای خروج جدا داشتند | هیچ wrapper/monkey-patch، close timer یا transitionend callback اضافه نشده | rapid close/reopen به transition بومی واگذار می‌شود؛ پاکسازی خصوصی به تعویق نمی‌افتد |
| hero جدید بدون قرارداد entrance | marker صریح `data-motion-part`، حداکثر ۴ گروه، ۲۰۰ms با stagger ۳۰ms، کل حداکثر ۲۹۰ms | فقط نخستین بازدید از هر design؛ filter و گام‌های سریع design هیچ entrance ندارند |
| خطر start state مخفی در animation تازه | CSS و inline style محتوا در حالت طبیعی کاملاً خوانا؛ WAAPI اختیاری با fill غیرماندگار | نبود WAAPI، خطای animate و لغو حرکت محتوا را پنهان نمی‌کند؛ opacity ابتدایی نیز صفر نیست |
| RAF پس‌زمینه demand-driven بود ولی CSS جداگانه ۲۴/۳۲ ثانیه infinite breathe داشت | loop مستقل atmosphere در لایهٔ جدید حذف می‌شود | geometry واقعی همچنان به pointer پاسخ می‌دهد؛ ادعای قبلی دربارهٔ settle مختص RAF بود و این تفاوت اکنون صریح ثبت شده است |
| خانواده‌های قدیمی Full و Reduced را یکسان تفسیر نمی‌کردند | policy تازه Auto/Full/Still را برای UI تازه مشخص می‌کند؛ override باریک Full برای transition buttonهای registered family | CSSهای قدیمی علمی/سینمایی کامل بازنویسی نشده‌اند؛ ادعای یکسان‌شدن تمام موتورهای قبلی وجود ندارد |

حرکت هندسهٔ SVG علمی، story و pointer/background RAF موجود دست‌نخورده‌اند. morph واقعی استثنای توضیحی paint روی main thread است؛ برای نشان‌دادن «GPU-only» به fade تقلیل پیدا نکرده است. constructor hero با frameهای مستقل دائمی کار نمی‌کند؛ هیچ RAF loop تازه‌ای اضافه نشده است.

## قرارداد ادغام هماهنگ‌کننده

۱. stylesheet جدید پس از stylesheetهای خانواده‌ها و gallery بارگذاری شود. script جدید قبل از `runtime.js` بارگذاری شود. فایل JS هنگام load هیچ listener سراسری نصب نمی‌کند؛ فقط API را معرفی می‌کند.

۲. در انتهای render موفق، **پس از** `updateMotion()`، فراخوانی زیر قرار گیرد:

```js
window.PortfolioMotion?.mount(document.querySelector('#portfolio'));
```

۳. در انتهای `updateMotion()`، `window.PortfolioMotion?.sync()` اجرا شود. runtime همچنان مرجع `data-effects="on|off"` و `data-motion="auto|full|still"` است. لایهٔ جدید این دو را بازنویسی نمی‌کند؛ فقط `data-pf-motion="spatial|still"` و intent ورودی را منعکس می‌کند.

۴. پیش از پاک‌کردن DOM خصوصی در `showAccess()`، `window.PortfolioMotion?.unmount()` فراخوانی شود. این فراخوانی animationها، pending entrance، media/visibility/input listeners و body observer را پاک می‌کند. هر `mount()` نیز ابتدا instance قبلی را کامل پاک می‌کند؛ listener تکراری نصب نمی‌شود.

۵. rendererهای تازه حداکثر چند **گروه مستقل** در hero را با `data-motion-part` مشخص کنند؛ marker در marker نگذارند. key از `body.dataset.design` می‌آید. mount اولیه یا انتخاب pointer از gallery می‌تواند entrance نخستین design را اجرا کند. `[data-design-step]` و `[data-motion-instant]` عمداً فوری‌اند. markerهای غیر hero، از جمله filter/resultها، وارد این موتور نمی‌شوند.

۶. `PortfolioMotion.entrance(root, {key})` در صورت نیاز برای ورود صریح موجود است؛ استفادهٔ عادی به mount کافی است. اگر native dialog هنوز باز باشد، entrance معلق می‌ماند و پس از event بومی close و نبود dialog دیگر اجرا می‌شود. Escape/keyboard، Still، hidden یا unmount آن pending را لغو می‌کنند. هیچ timeoutی به این رفتار اضافه نشده است.

## policy بررسی‌شده از کد و unit test

| وضعیت واقعی body/سیستم | نتیجهٔ لایهٔ تازه |
| --- | --- |
| Auto، effects on، بدون Reduced Motion | حرکت مجاز |
| Auto و Reduced Motion | geometry/UI تازه ثابت؛ feedback فعلی قابل خواندن |
| Full، effects on، حتی Reduced Motion | انتخاب صریح کاربر برای حرکت تازه مجاز |
| Still یا off | هیچ حرکت تازه‌ای اجرا نمی‌شود |
| effects off، حتی Full | هیچ حرکت تازه‌ای اجرا نمی‌شود |
| tab مخفی یا root مخفی/جداشده | animation تازه متوقف/لغو؛ محتوا طبیعی و خوانا |
| keydown حین entrance | لغو فوری animation و pending؛ focus منتظر نمی‌ماند |

override Full عمداً محدود است. از بین بردن کامل ترجیح سیستم در تمام CSSهای قدیمی و تمام موتورهای علمی در scope این تغییر نیست. state صریح Still باید به‌واسطهٔ runtime effects off نیز به موتورهای قبلی برسد.

## شواهد اجرای واقعی

`node --test tests/motion-system.test.js`: **۶ تست، ۶ موفق**. این‌ها قرارداد رفتاری را با fixture مصنوعی بررسی می‌کنند:

- Auto/Reduced/Full/Still/off و نبود تغییر پنهان‌کنندهٔ محتوا؛
- fallback خوانا هنگام نبود WAAPI و عدم اثر بر designهای بدون marker؛
- سقف تعداد/زمان و عدم replay برای filter یا انتخاب مجدد؛
- cancel روی Still، hidden و unmount و disconnect observerها؛
- انتخاب keyboard و گام سریع فوری، انتخاب pointer طراحی تازه مجاز؛
- انتظار native close برای hero پشت modal و پاک‌شدن pending هنگام lock.

`node --check public/portfolio/motion-system.js` موفق بود. whitespace check روی فایل‌های متعلق به این بخش خروجی خطا نداشت. تست‌ها با `linkedom` هستند و **اثبات CSS animation، focus trap واقعی، Safari، GPU/FPS یا feel محسوب نمی‌شوند**.

ساخت transition بومی با منابع فعلی [MDN dialog animation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog#animating_dialogs)، [starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style) و [transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior) تطبیق داده شد. compatibility آن enhancement است و در همهٔ مرورگرها یکسان فرض نشده است.

## باقی‌ماندهٔ بازبینی واقعی مرورگر

هماهنگ‌کننده مالک session مرورگر است. پس از ادغام باید entry/exit و rapid reopen، Escape/focus restoration، keyboard و pointer، Auto/Full/Still در Reduced Motion، tab مخفی، gallery filtering و هر ۱۵ renderer و renderer تازه بررسی شوند. screenshot/trace خصوصی خارج از Git بماند.

در دیالوگ سند که هنگام close مستقیماً DOM و iframe پاک می‌شود، خروج تصویری ممکن است فوری بماند؛ پاکسازی اطلاعات خصوصی بر ماندن node برای animation اولویت دارد. dialog فرمان `#jumpDialog` عمداً از animation کنار گذاشته شده است. اگر discrete top-layer transition در مرورگر هدف مشکل ایجاد کند، fallback درست حذف enhancement همان سطح است، نه تأخیر در Escape یا پاکسازی.

رأی این بخش: قرارداد JS با شش تست تأیید شده؛ پذیرش دیداری و cross-browser هنوز در انتظار اجرای هماهنگ‌کننده است. هیچ ادعای production-ready یا نرمی ۶۰/۱۲۰fps در این گزارش وجود ندارد.
