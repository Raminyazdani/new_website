# روش اجرا و ledger بازطراحی بصری و motion

این سند روش مرحله‌ای و معیار بازبینی مأموریت است؛ **متن قابل کپی و اجرایی** در [SKILL_OVERHAUL_SUPERPROMPT_FA.md](./SKILL_OVERHAUL_SUPERPROMPT_FA.md) قرار دارد. روش، نتیجهٔ اجرا یا اجرای skill را ادعا نمی‌کند.

## ۱. هدف و دامنه

بهبود یک‌پارچهٔ visual hierarchy، دو تم آبی/سفید و تیرهٔ غنی، typography، رسانه و پروژه‌ها، گالری/navigation و حرکت‌های محدود در `apps/new_website`. مرجع design فقط خواندنی است؛ تصمیم‌ها از قرارداد محلی، دادهٔ واقعی و شواهد قابل تکرار می‌آیند. پنج viewport اسمی برای آزمون واقعی: 320، 390، 768، 1024 و 1440 CSS px؛ هر خروجی باید عرض viewport و عرض client/scroll اندازه‌گیری‌شده را جدا نشان دهد.

### ورودی و قرارداد داده

- Raw input: JSON دریافتی از مسیر API فعلی؛ `PortfolioData.load({fetchImpl?, signal?, adapter?})` مقدار `{raw, model}` برمی‌گرداند و برای HTTP از `/api/cv`, `credentials: 'same-origin'`, `cache: 'no-store'`, JSON و AbortSignal استفاده می‌کند.
- Adapter: `window.PortfolioData.adaptCV(raw)`، مرز یگانهٔ تطبیق منبع به schema. خروجی پایدار `PortfolioModel v1` شامل `identity`, `profiles`, `contact`, `education`, `experience`, `projects`, `publications`, `skillGroups`, `certificates`, `languages`, `references`, `interests`, `stats`, `warnings` است. renderer فقط model را می‌بیند؛ raw CV را هرگز کپی یا بازتولید نمی‌کند.
- semantics: رشتهٔ گمشده `''`، آرایهٔ گمشده `[]`; مقدار صفر/false واقعی حفظ شود؛ ترتیب منبع حفظ و chronology/proficiency استنباط نشود؛ لینک‌های خارجی فقط HTTP(S) معتبر؛ warnings فاقد payload خصوصی باشند.
- renderer و runtime: composer اصلی سکشن‌های hero/about/projects/experience/publications/education/skills/certificates/languages/references/contact را می‌سازد؛ shared helper و data attributeهای تعریف‌شده در `PORTFOLIO_CONTRACT.md` حفظ شوند. rendererها listener یا API fetch نسازند.
- دادهٔ تست: فقط synthetic. هیچ فایل `C:/Users/...` از ورودی کاربر یا backup واقعی به Git وارد نشود.

## ۲. ویژگی‌های محافظت‌شده

| مورد | مرجع فعلی | شرط حفظ/بررسی |
| --- | --- | --- |
| JSON source adapter | `public/data/cv-adapter.js`, `public/data/portfolio-source.js`, `docs/PORTFOLIO_CONTRACT.md` | تنها مرز schema؛ error/401، ترتیب و فیلدها حفظ. |
| Auth/API/private data | `server/`, APIهای موجود، `.env` خارج از public | بدون تضعیف مجوز، session، `no-store` یا افشای شناسه/اطلاعات. |
| ۱۵ طراحی | `public/portfolio/design-registry.js`, `designs/{editorial,systems,experimental}.*` | id، rendererها، ساختار و استقلال حفظ؛ تغییر رنگ تنها تفاوت نباشد. |
| آرشیو ۲۰ Hero | `public/lab.html`, `public/designs/collection-*.js/css` | route و ۲۰ exploration موجود بمانند و از ۱۵تایی جدید تفکیک شوند. |
| Edition سابق | `public/editions/bioteal/` | مسیر مستقل و قابلیت‌های اصلی باقی بمانند. |
| Story | `public/portfolio/scroll-story.js/css` و shared study | سه فصل، scrubber/keyboard/scroll، topology ثابت ۷۲ vertex فعلی، cleanup و fallback. |
| Background/cursor | `public/portfolio/background-effects.js/css`, `pointer-effects.js/css` | پنج مدل (`glow`, `silk`, `membrane`, `molecular`, `aurora`) به‌علاوهٔ Off؛ شش گزینهٔ کل؛ preview، saved selection، pointer جدا، Auto/Full/Still و cleanup. |
| طراحی و navigation | `design-registry`, `design-gallery`, `studio.js`, `runtime.js` | gallery/dock، URL و preference، filter/search/count، انتخاب قبلی/بعدی، unified، keyboard/touch، focus/Escape. |
| محتوای رکورد | `records.js/css`, `visual-previews.js/css`, modal و tests | همهٔ رکوردها در دسترس؛ سرچ/filter/show-more، preview، README فقط با click، متن کامل، source link، references بسته به‌طور پیش‌فرض. |

ملاک «حفظ» یعنی رفتار و قرارداد با test یا مشاهدهٔ مرتبط مقایسه شود؛ وجود selector یا سورس به‌تنهایی، اثبات رفتار نیست.

## ۳. ثبت خط مبنا و بررسی‌های قبلی

منابع اصلی بررسی: `README.md`, `docs/PORTFOLIO_CONTRACT.md`, `docs/BUILD_PROGRESS.json`, `docs/design/AUDIT_METHOD_FA.md`, `docs/design/FIFTEEN_DESIGNS_PLAN_FA.md`, `FIFTEEN_DESIGNS_RESULTS.json`, `skill-audit/ANIMATE_WEB_SOURCES.json`، source، public page، design registry، styles، tests و local server rules.

نکته‌های provenance:

- Audit method قدیمی یک *plan/ledger شروع کار* بود و explicitاً همهٔ ۱۰۰۰ ردیف را `NOT_TESTED` گزارش می‌کرد. از آن به‌عنوان مدرک مرورگر/قبولی استفاده نکن.
- مدرک responsiveness پانزده‌تایی، ۷۵ row برای پنج عرض اسمی دارد؛ اندازه‌های client ثبت‌شده ۳۰۵/۳۷۵/۷۵۳/۱۰۰۹/۱۴۲۵ بوده‌اند. آن مدرک overflow و nameOverflow را در همان ردیف‌ها اندازه گرفته؛ به همهٔ تعاملات یا production تعمیم نده.
- `CINEMATIC_PORTFOLIO_RESULTS.json` نتیجه‌ای از نسخه/route/deployment قبلی دارد. آن را فقط برای فهم capabilityها و candidateهای regression ببین، نه proof build/deploy جدید؛ مجوز جاری کاربر برای انتشار همان GitHub/Vercel موجود جداگانه برقرار است.
- وضعیت نصب بعدی در `docs/design/skill-audit/INSTALLATION.json` و `INSTALLATION_FA.md` ثبت شده: ۵۲۸ project-scoped skill و ۴۱۸۶ فایل در `.agents/skills` نصب/اعتبارسنجی شده؛ این آمار به‌معنی خواندن ۵۲۸ متن skill نیست. مهارت‌های تأییدشدهٔ مرتبط در manifest شامل `od-frontend-design`, `od-ui-animation`, `emil-animate`, `emil-review-animations`, `emil-improve-animations`, `emil-animation-performance`, `emil-mobile-native`, `cds-animated-component-libraries`, `cds-motion-framer` و `iart-web-animation-accessible-animation` هستند. در این نگارش متن کامل `od-frontend-design` و `emil-mobile-native` خوانده شد؛ مسیر/نسخهٔ دقیق در manifest است. مهارت دیگر را فقط وقتی کامل بخوان که مرحلهٔ کار به آن نیاز دارد؛ نصب بودن به‌تنهایی یعنی آن را نادیده‌نگیر/اجرا کن نیست.
- Source inventory و provenance/access محدودیت‌های URLها و مخزن‌ها در `ANIMATE_WEB_SOURCES.json`, `MOTION_WEB_SOURCES.json`, `REPOSITORY_SOURCES.json` و فایل‌های فارسی آن‌ها ثبت است: [AgenticSkills animate](https://agenticskills.io/skills/animate), [AI UX Playground animate](https://aiuxplayground.com/skills/animate), [UI Skills motion directory](https://www.ui-skills.com/skills/motion), [animateai.pro](https://animateai.pro/), [Reddit extraction discussion](https://www.reddit.com/r/codex/comments/1sxufax/extracted_claude_design_system_prompt_so_you_can/), [Medium story teaser](https://medium.com/coding-nexus/stop-adding-random-animations-this-new-ai-skill-finds-exactly-what-your-ui-should-animate-f5c3c21ab6b7), [animations.dev skills index](https://animations.dev/skills), [Emil's skill index](https://emilkowal.ski/skill). Auditها مشخص می‌کنند Emil animate upstream/recipes خوانده شد؛ Medium متن کامل paywalled و teaser ناقص بود؛ animations.dev SKILL.md payload عمومی نداشت؛ Reddit extraction مرجع رسمی Anthropic نیست؛ animateai.pro محصول ویدیو است نه skill. برای سایر منابع از محتوا/اختیار پنهان‌شده نتیجه‌گیری نکن.

## ۴. Ledger بررسی بصری و حرکت

در اولین مرحله «شواهد موجود» را از «فرض/ملاحظه» جدا کن و سپس هر defect را در ردیف مستقل ثبت کن. ledger واقعی باید دست‌کم این فیلدها را داشته باشد:

| فیلد | معنا |
| --- | --- |
| `issue_id` | شناسهٔ یکتا؛ قابل پیوند به test/evidence. |
| `family` / `design_id` | `editorial`, `systems`, `experimental`, `unified` یا route آرشیو؛ مشخص شود کدام طراحی بررسی شد. |
| `route_state` | URL، انتخاب design، theme، background، motion mode، dialog/search state. |
| `viewport_input` | viewport اسمی و عرض واقعی client/scroll، دستگاه/مرورگر اگر معلوم است. |
| `observed` | فقط واقعیت دیده/محاسبه‌شده با screenshot/DOM/test. |
| `expectation` | انتظار observable ناشی از قرارداد یا design brief. |
| `issue_type` / `priority` | blocker, functional, visual hierarchy, typography, accessibility, motion, performance, responsive; priority با اثر واقعی توجیه شود. |
| `change` | فایل/کامپوننت و اصلاح کوچک قابل بررسی. |
| `recheck` | همان input/state که بعد از fix تکرار می‌شود. |
| `result` | PASS/FAIL/PARTIAL/NOT_TESTED با نتیجه و مسیر private evidence. |
| `limits` | نمونه‌برداری، browser/device، network، content یا محیط اجرا که بررسی نشده. |

قاعدهٔ سخت: «زیباتر به نظر می‌رسد» یا تغییر موفقیت‌آمیز CSS بدون شاهد، defect رفع‌شده نیست. از خط مبنا screenshot، pixel reading یا test فقط در صورت تولید واقعی استفاده کن. screenshot را به‌عنوان دادهٔ شخصی منتشر نکن. از arbitrary score و self-awarded perfection استفاده نکن؛ معیارهای تک‌تک acceptance gateها را نشان بده.

### حوزه‌های بررسی برای هر design family

- **Editorial** (`journal`, `helix`, `organic`, `monograph`, `specimen`): hierarchy مقاله/مقدمه، margin/annotation یا figure، long-form، تصویر و career ledger. مطمئن شو طرح‌های هم‌خانواده نیز ترکیب متمایز دارند.
- **Systems** (`pipeline`, `bento`, `atlas-map`, `console`, `blueprint`): خوانایی ابزار/جدول، grouped records، شمارش منبع و index. Charts/blueprints فقط census/source category نشان دهند، نه data analysis یا proficiency.
- **Experimental** (`chromatography`, `gallery`, `dossier`, `kinetic`, `horizon`): لایه/cover، مدیریت افق افقی در موبایل، typography نمایشی بدون رقابت با متن و تفاوت gallery/ledger/panorama.
- **Unified و archive**: unified اصلی، ۲۰ Hero archive و BioTeal edition را جدا route به route مرور کن. اشتراک CSS تنها وقتی پذیرفتنی است که palette، contrast، focus و archive default به هم نریزند.

## ۵. فازها و gateها

| فاز | کارها | Gate برای رفتن به بعد |
| --- | --- | --- |
| 0. Brief و دسترسی | scope، branch/status کاری دیگران، AGENTS و auditها را بخوان؛ manifest نصب و source inventory را بازبینی کن؛ مسیر دقیق skillهای مرتبط را از manifest بیاب و full text همان موارد را بخوان؛ raw/source/API/auth boundaries و مجوز انتشار همان GitHub/Vercel را مشخص کن. | مسیر مالکیت فایل‌ها، رفتار محافظت‌شده، مهارت‌های واقعاً بررسی‌شده، ابزارهای موجود و حدود انتشار مستند است. نصب/اعتبارسنجی ۵۲۸ skill را به معنی خواندن/اجرای همهٔ آن‌ها معرفی نکن. |
| 1. Baseline | routeها و stateهای ۱۵ طراحی، unified، lab, edition، gallery/dock، story, backgrounds, project modal و رکوردها را در viewportهای اسمی ببین؛ رفتار روشن/تیره و reduced motion را در صورت امکان نمونه‌برداری کن؛ ledger بنویس. | هر ادعای تصویری trace به مشاهده دارد؛ بخش ندیده `NOT_TESTED`. |
| 2. System design | palette و token دو تم؛ hierarchy تایپ؛ سطح‌های UI؛ focus/hover/pressed/disabled/error/loading; breakpoint؛ حرکت به تفکیک purpose/frequency/accessibility. | سبک مشترک با تفاوت family و تعاریف قابل اندازه‌گیری مرور شده. |
| 3. Foundation | CSS vars, common controls, shared project/media, typography, theme/focus/responsive; هیچ codepath auth/data را تغییر نده مگر bug واقعی با تکلیف مشخص. | model, source contract و responsive long text محفوظ؛ synthetic tests مرتبط می‌گذرند. |
| 4. Families/15 | هر یک از ۱۵ design id و render sectionها مرور؛ تفاوت hero, about, projects, experience, records حفظ؛ theme tokens در همهٔ familyها. | ledger ۱۵/۱۵ شناخت دارد و تمام تغییرها در هر affected layout recheck شده‌اند. |
| 5. Gallery/navigation/media | search/filter/count/selection, previous-next, Unified/reset, URL/preferences, keyboard/touch/focus, Escape, dialog scroll, project card preview/modal/readme. | flowهای معمول و error/empty/long record بدون focus/overflow loss کار می‌کنند. |
| 6. Motion/story/background | timing tokens و CSS/WAAPI انتخاب کم‌هزینه؛ entrance/exit; reduced, Auto/Full/Still; stable story morph; background off/preview; pointer; pause/cleanup. | هریک از interactionهای تغییرکرده با mode/route مشاهدۀ مشخص دارد؛ high-motion disabled state نیز روشن و خوانا است. |
| 7. Verification | test موجود، browser 5 widths × 15 designs برای overflow/name/single h1/section/portrait; keyboard/touch; themes; story/background modes; modal/gallery/records; check console/network/privacy. | نتایج واقعی ردیف‌به‌ردیف در BUILD_PROGRESS + docs/design evidence؛ unresolved موارد با status مشخص. |
| 8. Release همان پروژه | پس از gateهای پذیرش، diff را بازبینی، تغییرهای این scope را به branch/GitHub همین پروژه commit/push و روی همان Vercel project موجود deploy کن؛ migration، asset match، API/privacy و production checks واقعی را انجام بده. | deployment ID/commit/state و live browser evidence از ابزار ثبت شده؛ در صورت شکست gate/deploy، failure دقیق گزارش شود و چیزی به‌عنوان deployed جا زده نشود. |
| 9. Handoff | diff scope، skillهای واقعاً خوانده/اجراشده، command/result، limitations، unverified items، evidence بیرون Git، commit/deployment proof ثبت شود. | نتیجهٔ deployed با live proof، یا مانع واقعی/failed state شفاف ثبت شده است. |

کاهش scope در صورت time/environment constraints به معنی پنهان‌کردن تست‌نشده‌ها نیست. اجرای full 15×5 interaction matrix الزام برای overflow/namecheck است؛ حالت‌های theme/motion/media را می‌توان در matrix جداگانهٔ sampling ثبت کرد، ولی فقط همان covered combinations را گزارش بده.

## ۶. نقشهٔ کاربرد motion

`animate` upstream این ترتیب را آموزش می‌دهد: اول آیا حرکت لازم است و هدفش چیست، بعد ابزار/property/easing/duration، قطع‌پذیری/exit و reduced-motion/pointer gating. برای این پروژه از آن به‌عنوان تصمیم‌یار استفاده کن، نه مجموعهٔ دستورهای غیرقابل‌بحث. سخت‌گیری اصلی: token فعلی را گسترش بده؛ library برای fade نصب نکن؛ transition همگانی ننویس؛ keyboard action پرتکرار را متحرک نکن؛ transitionهای سریع باید retarget شوند؛ حرکت خروج با ورود سازگار؛ متن خواندنی ثابت.

| سطح | راهنمای کاربرد | بررسی واقعی |
| --- | --- | --- |
| Gallery/dock | تغییر انتخاب و highlight روشن و کم‌وقفه؛ فیلتر پرتکرار بدون entrance/stagger؛ dialog فقط هنگام open/close. | tab/arrow/click, open-close, Escape, restore focus, reduced. |
| Project cards/media | state hover/focus/press کوچک؛ lazy/media load به‌عنوان state فوری؛ هیچ جابه‌جایی layout عمده. | slow network/load/error, touch, reduced, scroll. |
| Project modal | محور مرکز؛ backdrop و پنل هماهنگ؛ escape جهت ورود، قابل قطع؛ duration از token معتبر. | keyboard focus trap/restoration، backdrop/close، بلند و قابل scroll، touch و reduced. |
| Story morph | حرکت فضایی هدفمند و پیوسته؛ ۷۲ vertex فعلی stable؛ آنچه متن/داده است در حرکت گم نشود. | start/intermediate/end/back scrub، keyboard, mobile/static, reduced, switch design/unmount. |
| Background | decoration پشت foreground؛ subtle, slow, no fake hover on touch; do not animate reading content. | پنج مدل + Off (شش گزینه) × light/dark, Auto/Full/Still, pointer fine/coarse, hidden tab, preview unmount. |
| Headings/type | reveal محدود صرفاً در اولین معرفی؛ no kinetic body/data; no tracking/width/layout movement on real text. | long Persian/English/mixed names, zoom/text scaling, reduced motion. |

مقادیر جزئی easing/duration را از styles فعلی بخوان. اگر skill اعداد پیشنهادی دارد اما با existing scale یا UX frequency تعارض دارد، به قرارداد محلی اولویت بده و دلیل تصمیم را در ledger ثبت کن. CSS transforms همیشه به معنی hardware acceleration نیستند؛ performance claim باید از profiler/browser observation بیاید.

## ۷. خروجی‌های عملیاتی و نگهداری

در صورت اجرای مأموریت، خروجی‌ها باید شامل diffهای محلی در scope، test commandها و خروجی واقعی، ledger بازبینی با status، evidence JSON فارسی/ماشینی مناسب و update به `docs/BUILD_PROGRESS.json` باشند. عکس واقعی و ورودی خصوصی بیرون repository نگه داشته شوند و صرفاً مسیر محلی امن در گزارش ذکر شود. گزارش باید واضح کند کدام موارد پاس، شکست، ناقص، تست‌نشده یا مسدودند.

دستور فعال کاربر نصب project-scoped skillها و انتشار روی GitHub branch و Vercel project موجود را مجاز کرده است. روش به‌تنهایی چیزی را اجرا نمی‌کند، اما عاملِ اجرای همان task باید پس از گیت‌های واقعی، تا deploy و verification زنده پیش برود. زیرساخت/حساب/destination تازه، هزینهٔ تازه، نصب global یا ارسال credential/private data انجام نشود. هر تغییر در contract داده، route، auth، palette، theme token، skill dependency، release state یا test matrix ثبت شود؛ کد موجود را بدون نیاز مشخص بازنویسی نکن.
