# نقشهٔ پیاده‌سازی واقعی

این نقشه از توابع، شناسه‌ها و selectorهای موجود در سورس عمومی `public/` استخراج شده است؛ «نامزد منتخب» در دفتر اطلس به‌تنهایی برچسب پیاده‌سازی نمی‌گیرد. تطبیق ایده فقط جایی ثبت شده که هدفش در کد حاضر است: `BIO-093` کارت حاشیه‌نویسی‌شدهٔ پژوهش، `CODE-081` چیدمان README پروژه در نمای ترمینال، و `CODE-035` دسته‌بندی/فیلتر موضوعی پروژه‌ها. این تطبیق‌ها پیاده‌سازی خط‌به‌خطِ تمام پیشنهاد اطلس را ادعا نمی‌کنند.

## دسترسی به نماها

- طراحی‌ها: `/?design=atlas|molecular|terminal&section=SECTION&theme=light|dark`
- مقدارهای `section` واقعی: `hero`, `about`, `projects`, `experience`, `publications`, `education`, `skills`, `certificates`, `languages`, `references`, `contact`.
- انتخابگر همان سایت `public/portfolio/studio.js` این queryها را می‌خواند، `body[data-concept]` و `body[data-theme]` را می‌چیند و لینک قابل‌اشتراک می‌سازد. کد CV یا API در صفحهٔ کتابخانهٔ طراحی بارگیری نمی‌شود.
- نسخه‌های بایگانی‌شده: [`/editions/bioteal/`](/editions/bioteal/) و [`/lab.html`](/lab.html). دفتر ۳۵۰ایده در [`/portfolio/design-catalog.json`](/portfolio/design-catalog.json) محفوظ است.

## ۱۱ بخش × سه نمایش

| بخش و selector واقعی | اطلس زیستی | فرم مولکولی | دفترچهٔ کد |
|---|---|---|---|
| Hero · `#hero`, `hero()` | `st-atlas-hero`: تصویر سلولی انتزاعی، پرتره، معرفی | `st-molecular-hero`: تصویر molecule انتزاعی و پرتره | `st-workspace`: file tree نمایشی، معرفی و پرتره |
| About · `#about`, `about()` | بیانیه، metrics منبع‌دار و interests بازشدنی | dossier، تصویر protein illustrative و metrics | حاشیهٔ notebook، بیانیه و metrics |
| Projects · `#projects`, `projects()`/`projectCard()` | کارت‌های موضوعی و mini-study CSS انتزاعی | dossier کارت‌ها با spine و mini-study تزئینی | رکورد README با title/description/tags/لینک واقعی |
| Experience · `#experience`, `experience()` | timeline گره‌دار با جزئیات بازشدنی | timeline/زنجیرهٔ نقش‌ها | history rows با period و شاخهٔ تزئینی |
| Publications · `#publications`, `renderers.publications()` | کارت پژوهشی با metadata، نقش، یادداشت و لینک | ledger مرتب‌شده | یادداشت‌های پژوهشی به سبک notebook |
| Education · `#education`, `renderers.education()` | کارت/فصل زمان‌دار | polymer-track از رکوردهای تاریخ‌دار و گره‌ها | ردیف‌های تاریخ‌دار دفترچه |
| Skills · `#skills`, `renderers.skills()` | ناوبر دامنه به شکل گروه‌های بازشدنی | کارت دامنه و زیرگروه‌ها | فهرست ابزار/روش در notebook، جست‌وجوپذیر |
| Certificates · `#certificates`, `renderers.certificates()` | credential catalog با search و issuer filter | کاتالوگ کارت‌های قاب‌دار | catalog فشردهٔ ردیفی |
| Languages · `#languages`, `renderers.languages()` | کارت سطح متنی و آزمون اختیاری | کارت‌های سادهٔ زبان | ردیف‌های notebook |
| References · `#references`, `renderers.references()` | دفترچهٔ افراد؛ اطلاعات بسته تا کلیک | کارت پرونده‌ای بسته | فهرست notebook با disclosure بسته |
| Contact · `#contact`, `renderers.contact()` | پایان‌بندی با پیوندهای مستقیم | پایان‌بندی dossier | پیوندهای انتهایی notebook |

هر سه مفهوم از همان model CV و `records.js` استفاده می‌کنند؛ تمایز سکشن‌های records از `body[data-concept]` در `records.css` می‌آید. selectorها و رفتارهای اصلی مشترک شامل `[data-project-search]`, `[data-project-filter]`, `[data-project-card]`, `[data-open-project]`, `[data-skill-search]`, `[data-cert-search]`, `[data-cert-issuer]`, `[data-cert-card]`, `[data-cert-more]`, `[data-copy-citation]` و `<details class="record-reference">` هستند. جست‌وجو/فیلتر، کپی citation و بازشدن معرف در `runtime.js` انجام می‌شوند.

## مرزهای تصویر و ادعا

- `science.js` از `PortfolioScience.art('cell'|'molecule'|'protein')` مسیر هندسی SVG می‌سازد؛ این ساختارها **generic و illustrative** هستند، نه مولکول شناسایی‌شده، ساختار پروتئینی، نتیجهٔ آزمایش یا دادهٔ پژوهشی.
- بیشینهٔ هم‌زمان در هر مفهومِ فعال: Atlas یک صحنهٔ SVG؛ Molecular دو صحنه (Hero و About)؛ Terminal هیچ صحنهٔ سه‌بعدی. سقف قابل‌مشاهده در یک نما دو SVG است. سایر previewهای پروژه CSS تزئینی‌اند، نه مدل مولکولی.
- اگر science art بار نشود، متن، عناوین، لینک‌ها و تصویر واقعی CV همچنان محتوای معنایی‌اند؛ هندسهٔ science فقط لایهٔ تزئینی است. پروژهٔ کتابخانه به دادهٔ شخصی یا `/api` وصل نمی‌شود.
- «workspace»، «README»، «branch» و «polymer track» استعارهٔ چیدمان‌اند. کد منبع پروژه، molecule معتبر، نتیجه، KPI، سطح مهارت یا رابطهٔ ژنی از این تصاویر استنتاج نمی‌شود.
- ۳۵۰ رکورد اطلس حفظ شده‌اند؛ ۲۰ `selected_candidate` همچنان نامزدند. فیلد `implementation` فقط در سه رکوردی می‌آید که کاربرد منطبق در منبع دیده شد؛ ایده‌های دیگر برای نگه‌داری در بانک، خودکار به اجرا تعبیر نشده‌اند.
