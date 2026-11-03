# ممیزی منابع طراحی و حرکت — ۳ نوامبر ۲۰۲۶

چهار نشانی خواسته‌شده جداگانه بررسی شدند. دو مخزن عمومی واقعی پیدا شد: ۱۶ skill استاندارد Emil و ۱۴ دستورکار Markdown در نسخهٔ Codex مخزن Trystan. همهٔ فایل‌های skill و فایل‌های راهنمای همراه Emil، کل prompt بیست‌فصلی و همهٔ ۱۴ دستورکار Codex، README و مجوز هر دو مخزن کامل خوانده شدند. نسخهٔ Claude با همان نام‌های دستورکار، نسخهٔ تکراری محسوب شد و خوانده/نصب نشده است. این گزارش فقط پژوهش است؛ نصب و تغییر برنامه را هماهنگ‌کننده انجام می‌دهد.

## دسترسی واقعی هر منبع

| منبع | آنچه واقعاً قابل خواندن بود | نتیجه برای نصب |
| --- | --- | --- |
| [Reddit](https://www.reddit.com/r/codex/comments/1sxufax/extracted_claude_design_system_prompt_so_you_can/) | پست، نظرهای موجود و پیوند مستقیم مخزن | مخزن Trystan واقعی و قابل دریافت است. ادعای استخراج از Claude تأیید مستقل نشده؛ این متن دستور سیستمی Anthropic نیست. |
| [مقالهٔ Medium](https://medium.com/coding-nexus/stop-adding-random-animations-this-new-ai-skill-finds-exactly-what-your-ui-should-animate-f5c3c21ab6b7) | مقالهٔ عضوویژهٔ ۲۳ ژوئیهٔ ۲۰۲۶؛ فقط مقدمه تا بخشی از مثال CSS اول | ادامه پشت paywall است. هیچ دورزدن، ورود، ثبت‌نام یا خریدی انجام نشد. نام `find-animation-opportunities` مستقلاً در مخزن اصلی Emil پیدا و متن کاملش خوانده شد؛ محتوای پنهان مقاله حدس زده نشده است. |
| [animations.dev/skills](https://animations.dev/skills) | HTTP 200؛ متن عمومی و فهرست پیوندهای HTML | فرم عضویت خبرنامه است و پیوند عمومی SKILL.md یا بستهٔ دانلود ندارد. ایمیلی ثبت نشده و دریافت/نصب محتوای بسته ادعا نمی‌شود. |
| [emilkowal.ski/skill](https://emilkowal.ski/skill) | صفحهٔ رسمی نویسنده و تمام فهرست | پیوندهای `emilkowalski/skill` به `emilkowalski/skills` منتقل می‌شوند. صفحه ۱۵ مورد دارد ولی مخزن فعلی ۱۶ مورد دارد؛ `remove-animations` مورد اضافه است. |

## نسخهٔ ثابت، مجوز و محل متن کامل

| مخزن | commit بررسی‌شده | مجوز |
| --- | --- | --- |
| [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/f1090bec277140d02ed202440185ad9d02ac1490) | `f1090bec277140d02ed202440185ad9d02ac1490` | MIT، Emil Kowalski، ۲۰۲۶ |
| [Trystan-SA/claude-design-system-prompt](https://github.com/Trystan-SA/claude-design-system-prompt/tree/3c3ddb07d7aa3fef051d83608596470c95cfd8fe) | `3c3ddb07d7aa3fef051d83608596470c95cfd8fe` | MIT، Trystan Sarrade، ۲۰۲۶ |

فایل‌های متن ساده از GitHub API/raw همان commit گرفته شده‌اند و هیچ اسکریپت فروشنده اجرا نشده است. نسخهٔ محلی کامل و manifest شامل SHA256 تک‌تک فایل‌ها زیر این مسیر قرار دارد:

`C:/Users/yazda/Documents/PORTFOLIO_DESIGN_DIGEST/skill_sources_20261103/web/`

زیرپوشه‌ها `emilkowalski__skills` و `Trystan-SA__claude-design-system-prompt` هستند. این مسیر خارج از Git برنامه است؛ شامل هیچ CV، screenshot واقعی، credential یا دادهٔ خصوصی پروژه نیست. جزئیات ماشینی در `MOTION_WEB_SOURCES.json` کنار این گزارش ثبت شده است.

هر دو LICENSE الزام می‌کنند متن copyright و اجازه‌نامه با نسخه‌های کپی‌شده/بخش‌های عمده حفظ شود. جملهٔ README مخزن Trystan دربارهٔ ضروری‌نبودن attribution این شرط مجوز را حذف نمی‌کند.

## همهٔ skillهای واقعی Emil و کاربردشان

هر سطر زیر پوشهٔ واقعی `skills/<name>/SKILL.md` دارد. نصب خود skill فقط نصب دستورکار متنی است؛ الزام به نصب بستهٔ runtime معرفی‌شده در متن ایجاد نمی‌کند.

| نام | دستورکار خوانده‌شده | نگاشت به برنامه |
| --- | --- | --- |
| `emil-design-eng` | ابتدا بسامد و هدف حرکت، سپس ابزار، ویژگی، منحنی و زمان؛ سازگاری و بازبینی محسوس | معیار مشترک برای هر ۱۵ طرح؛ بدون تبدیل اجباری به React |
| `animate` | ساخت حرکت با ارزان‌ترین ابزار، tokenهای موجود، قطع‌پذیری، مسیر خروج و Reduced Motion؛ `RECIPES.md` کامل | CSS/WAAPI برای modal و feedback؛ استثنای مستند برای geometry علمی |
| `animate-expo` | UI worklet، shared value، gesture، navigation و haptics بومی؛ `RECIPES.md` کامل | مخصوص React Native/Expo؛ در وب فعلی کاربرد اجرایی ندارد و بسته‌های native نباید اضافه شوند |
| `review-animations` | ده معیار، شواهد file:line و جدول Before/After/Why با رأی نهایی؛ `STANDARDS.md` کامل | بازبینی پایانی حرکت، با تشخیص استثناهای واقعی |
| `improve-animations` | شناسایی، ممیزی هشت‌محوری، اولویت و plan مستقل و دقیق؛ `AUDIT.md` و `PLAN-TEMPLATE.md` کامل | مرحلهٔ مشاوره جدا از ساخت؛ مجوز فعلی کاربر برای اجرای اصلاحات لازم پابرجاست |
| `find-animation-opportunities` | فقط پیشنهاد خواندنی، حداکثر ۵–۷ فرصت پس از چهار دروازهٔ بسامد، هدف، سرعت و کارکرد؛ موارد ردشده اجباری | چند seam مؤثر، نه wishlist انیمیشن برای همه‌چیز |
| `remove-animations` | حذف/کاهش با بررسی start state مخفی، callback، unmount و focus؛ ثبت موارد حفظ‌شده | حذف تزئین تکراریِ بی‌دلیل؛ حفظ morph توضیحی و رفتار مستند |
| `animation-performance` | تشخیص علت قبل از تغییر؛ property، driver، thread، style recalc، blur و layer | SVG geometry کار main thread است؛ ادعای GPU یا FPS بدون trace مجاز نیست |
| `animation-vocabulary` | واژه‌نامه برای نام‌گذاری دقیق، نه ساخت | morph با crossfade یکی نیست؛ پیشرفت scroll باید مستقیم باشد |
| `apple-design` | مقدار فعلی روی صفحه، قطع‌پذیری، انتقال velocity، پاسخ press، restraint، type/material و دسترس‌پذیری | محتوای خواندنی ثابت؛ بدون افزودن خودکار glass/haptics/audio |
| `write-swift` | values، concurrency/actor، Sendable، generics، ARC/profiling، Swift Testing و migration نسخه‌محور | تمام متن ۴۲KB خوانده شد؛ کد Swift در این برنامه نیست |
| `pick-ui-library` | اجرای صریح، بررسی stack موجود، انتخاب وابستگی مناسب و پرهیز از churn | `<dialog>` بومی موجود را صرفاً برای پیروی از فهرست به React تبدیل نکنیم |
| `prototype` | جهت‌های واقعاً متفاوت در harness جدا؛ full-size، انتخاب فوری و cleanup؛ `PICKER.md` کامل | مجموعهٔ فعلی ۱۵ طرح محصول خواسته‌شده است؛ به سه prototype تقلیل پیدا نمی‌کند |
| `mobile-native` | capability query، press، viewport/safe area، ورودی ۱۶px، svh/dvh، حفظ zoom و آزمون واقعی موبایل | gallery، keyboard ورودی جست‌وجو و overflow؛ از کار انداختن scroll سند لازم نیست |
| `break-ui` | دادهٔ بدِ محتمل در boundary واقعی، dev-only؛ Empty/One/Huge، ۳۲۰px، zoom، RTL؛ `CATALOG.md` کامل | فقط fixture مصنوعی برای عنوان، tag و متن فارسی بلند؛ دادهٔ CV عمومی نشود |
| `ask-sonner` | setup/API/style/async و theme/position؛ `API.md` کامل | برنامهٔ vanilla برای toast ساده نیازمند React/Sonner نیست |

بسته‌های معرفی‌شده در `pick-ui-library` یا `animate-expo` توصیه‌های شرطی‌اند. Sonner به React نیاز دارد؛ Expo/Reanimated/Worklets/Gesture Handler مربوط به native هستند؛ Motion فقط وقتی spring/gesture پیچیده ارزش هزینه‌اش را دارد مناسب است. CSS transition و WAAPI برای بیشتر حرکت‌های موجود کافی‌اند.

## دستورکارهای واقعی Trystan

این مخزن در نسخهٔ Codex پوشهٔ استاندارد `SKILL.md` ندارد؛ ۱۴ فایل مستقل زیر `codex/skills/*.md` دارد. نصب‌کنندهٔ رسمی skill نمی‌تواند این فایل‌ها را مستقیماً به‌عنوان پوشهٔ skill نصب کند. بسته‌بندی درست در صورت نصب: wrapper پروژه‌ای کوچک با نام یکتا، ارجاع به متن اصلی بدون دستکاری و حفظ LICENSE. prompt کامل نیز reference بماند. `codex/AGENTS.md` فروشنده نباید جای AGENTS ریشه یا تنظیم عمومی بنشیند.

| دستورکار | کاربرد/محدودیت در این پروژه |
| --- | --- |
| `discovery-questions` | خواندن context موجود و عبور از kickoff در scope روشن؛ سهمیهٔ سؤال و ابزار ساختگی `questions_v2` اعمال نمی‌شود |
| `frontend-aesthetic-direction` | برای greenfield بدون برند؛ اینجا vocabulary موجود هر طرح مبناست |
| `wireframe` | کاوش grayscale با محور واقعی؛ شروع دوبارهٔ ۱۵ طرح لازم نیست |
| `make-a-deck` | deck HTML؛ starter توصیف‌شده در مخزن نیست؛ برای این overhaul کاربرد ندارد |
| `make-a-prototype` | state و interaction واقعی؛ fake timer/localStorage فقط در prototype مصنوعی و جدا |
| `make-tweakable` | کنترل‌های محدود و مفید؛ wildcard postMessage وابسته به host دیگری است و وارد production نمی‌شود |
| `generate-variations` | تفاوت substantive در hierarchy/layout/interaction؛ registry فعلی ظرف مناسب است |
| `design-system-extract` | استخراج مقدار دقیق از source همراه provenance و ثبت gap؛ شامل motion token |
| `component-extract` | فهرست component/state/token/accessibility؛ کنترل مشترک با ترکیب‌بندی متمایز سازگار است |
| `accessibility-audit` | contrast، semantic، keyboard/focus و motion/forms با شواهد؛ رنگ سفید خالص به‌خودی‌خود نقض WCAG نیست |
| `ai-slop-check` | سنجش decoration و defaultهای بی‌هدف؛ حذف کور SVG علمی یا تمام تنوع طرح‌ها نادرست است |
| `hierarchy-rhythm-review` | مقیاس type/spacing، اولویت و rhythm هر طرح؛ نه هم‌شکل‌کردن ۱۵ طرح |
| `interaction-states-pass` | default/hover/press/disabled/focus/loading واقعی؛ focus فوری و hover متناسب با capability |
| `polish-pass` | چهار مرور کامل، dedup، اصلاح blocker/quality و آزمون مجدد؛ عنوان Ready to ship جای شواهد اجرا را نمی‌گیرد |

## تعارض‌ها و تصمیم‌های اجرایی

۱. prompt سوم‌شخص اختیارات جدید ایجاد نمی‌کند. دستور پنهان‌کردن نام skill، توقف برای پرسش‌های تکراری، تظاهر به ابزارهای host ناموجود یا تحویل سه ویژگی از پنج ویژگیِ خواسته‌شده، با درخواست فعلی و قرارداد پروژه سازگار نیست. متن برای استفادهٔ گزینشی نگه داشته می‌شود، نه ارتقا به policy.

۲. میان منابع حتی در عددها تناقض هست: «همهٔ UI زیر ۳۰۰ms» در کنار recipeهای toast با ۴۰۰ms و drawer با ۵۰۰ms؛ «فقط transform/opacity» در کنار استثنای clip-path، ارتفاع accordion و عرض indicator کوچک. تصمیم مشترک پیشنهادی: press حدود ۱۶۰ms، سطح occasional حدود ۱۸۰–۲۵۰ms، focus/filter/انتخاب سریع و keyboard فوری؛ استثنای توضیحی مستند و اندازه‌گیری‌شده.

۳. reduced-motion با Off صریح یکسان نیست. Auto با ترجیح سیستم باید geometry ثابت یا feedback سادهٔ opacity داشته باشد. Off باید کار تزئینی را متوقف کند. توصیهٔ عمومی «بازخورد را کامل حذف نکن» مجوز فعال‌کردن دوبارهٔ حرکت در Off نیست.

۴. SVG `d` و `cx/cy` با transform یکسان نیستند و paint روی main thread دارند. حذف geometry برای رسیدن صوری به «GPU-only» هدف واقعی morph را خراب می‌کند. راه درست، bounded geometry و اجرای demand-driven/visible-only و profile واقعی است. `will-change` فراگیر درمان این هزینه نیست.

۵. توصیهٔ `ask-sonner` برای بردن toaster به ریشه با z-index، به‌تنهایی از top layer دیالوگ بومی عبور نمی‌کند. بازخورد مرتبط باید در خود دیالوگ یا مسیر غیررقابتی مناسب باشد. semantics بومی، focus و announcement باید آزموده شوند.

۶. رنگ، فونت و منع illustration در Trystan heuristic سلیقه‌ای‌اند؛ مدرک نقص نیستند. فونت موجود یا SVG علمیِ هدفمند را صرفاً با grep حذف نکنیم و به جای آن asset پولی/stock اضافه نکنیم. fact، لینک و record واقعی باید حفظ شود.

## نقشهٔ تغییر برای ساختار واقعی برنامه

| سطح | مشاهدهٔ source | تصمیم و معیار پذیرش |
| --- | --- | --- |
| registry پانزده‌طرحی | `design-registry.js:58` و سه خانوادهٔ `designs/*.js` | یک policy/token مشترک؛ required renderer و content count هر ۱۵ طرح حفظ شود |
| NativeGallery | هیچ symbol/import با این نام پیدا نشد؛ سطح واقعی `<dialog id="designGallery">` و `PortfolioDesignGallery` است | centered origin برای modal صحیح است؛ scale حدود `.96` و opacity اختیاری، input/filter/focus فوری؛ Escape، trap، restore focus، live results و موبایل بررسی شوند |
| morph علمی | `scroll-story.js:72,97,163,171`؛ geometry واقعی، static/manual fallback و gate visibility موجود | اتصال و endpointهای واقعی حفظ؛ نمونه/attribute محدود، read قبل از write، RAF خاموش بیرون viewport/در tab مخفی/unmount؛ scrub دستی و keyboard قابل استفاده |
| background RAF | `background-effects.js:204–254` از قبل capability/reduced/hidden/dialog را gate می‌کند و پس از settle قطع می‌شود | این کد loop بی‌نهایت idle نیست. هزینهٔ rebuild geometry، SVG writes و observer وسیع نیازمند trace است؛ باگ dropped frame از source تنها اثبات نشده |
| modal/scroll عمومی | `runtime.js:14,20,26,30` و `visual-previews.js:100` | propertyهای صریح، open/close/reopen امن و focus فوری؛ progress مستقیم، no hidden start-state، حفظ پاکسازی iframe/README خصوصی |

خط‌های بالا محل مشاهدهٔ source در زمان ممیزی‌اند؛ پس از تغییر باید دوباره resolve شوند و اثبات آزمون محسوب نمی‌شوند.

### تفاوت‌های حفظ‌شدنی هر طرح

| طرح | policy پیشنهادی |
| --- | --- |
| `journal` | reading-first؛ records ثابت و dialog کوتاه |
| `helix` | هویت سینمایی/علمی با entrance نادر؛ بدون replay روی filter/هر بازگشت scroll |
| `organic` | فرم زیستی توضیحی؛ well-plate و countهای واقعی ثابت |
| `monograph` | تایپوگرافی ثابت؛ reveal پرتره حداکثر یک‌بار و بدون مخفی‌کردن محتوا |
| `specimen` | scanning آرشیوی؛ label، index و grid ثابت |
| `pipeline` | انتخاب و navigation workspace فوری؛ بدون typewriter داده‌ها |
| `bento` | factهای dashboard بدون count-up یا lift همگانی |
| `atlas-map` | census و dot matrix پایدار، category مستقیم و keyboard-safe |
| `console` | disclosure بومی و متن source خوانا؛ بدون تایپ/scanline روی records |
| `blueprint` | خط توضیحی یک‌باره در صورت نیاز؛ schedule و label ثابت |
| `chromatography` | band به‌عنوان illustration، بدون ادعای اندازه‌گیری واقعی |
| `gallery` | framing تصویر، بدون animation نتیجهٔ هر جست‌وجو |
| `dossier` | sheetهای فشرده/طبقه‌بندی ثابت؛ feedback مشترک |
| `kinetic` | حرکت انتخابی متناسب با هویت؛ محدود و خاموش هنگام reading/Reduced/Off |
| `horizon` | اتمسفر اختیاری و bounded؛ بدون drift بی‌پایان تمام صفحه |

## فرصت‌ها و ردهای مشخص

فرصت اول، پیوستگی باز و بسته‌شدن دیالوگ‌های occasional است: CSS/WAAPI، opacity و scale محدود، ۲۰۰–۲۵۰ms با `cubic-bezier(0.23,1,0.32,1)`، همراه cancellation، focus و Reduced Motion. فرصت دوم feedback press محدود است: scale `.97`، حدود ۱۶۰ms، بدون delay در اجرای عمل. فرصت سوم فقط narrative توضیحی علمی است که هندسهٔ واقعی باید ادامه پیدا کند؛ «زیباتر شدن» دلیلی برای حرکت factها نیست.

موارد ردشده: count-up تعداد recordها، reveal تکراری هر section، حرکت نتیجهٔ filter در هر keypress، تایپ تدریجی اطلاعات علمی، و loop پس‌زمینهٔ مستقل از کاربر. این‌ها خواندن یا عمل سریع را عقب می‌اندازند. تصمیم دربارهٔ نرمی حرکت موجود به مشاهده و trace نیاز دارد؛ این گزارش آن را از روی متن کد قطعی اعلام نمی‌کند.

## تحویل به نصب و آزمون

برای Emil، helper رسمی skill-installer از قبل نصب‌شده با `--repo emilkowalski/skills --ref f1090bec277140d02ed202440185ad9d02ac1490 --path skills/<name> --dest <project>/.agents/skills` کافی است؛ همهٔ ۱۶ پوشه و companionها باید حفظ شوند. از اجرای `npx skills@latest` صفحهٔ فروشنده برای این کار نیازی نیست. wrapperهای Trystan باید source و مجوز و محدودیت priority را مشخص کنند؛ AGENTS فروشنده در ریشه قرار نگیرد.

پیش از تأیید نتیجه، تست meaningful موجود برای هر ۱۵ renderer، مجموعهٔ source-grounded، privacy، motion mode و gallery اجرا شود؛ سپس مشاهدهٔ desktop/mobile، Reduced Motion/Off، keyboard/Escape/focus و rapid open/close انجام شود. performance روی دستگاه واقعی و trace، با unit test متنی اثبات نمی‌شود. در این پژوهش نه اجرای زندهٔ UI انجام شده، نه نرمی ۶۰/۱۲۰fps و نه آمادگی deployment ادعا می‌شود.
