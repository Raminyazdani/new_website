# Audit of animation skill sources

**Date:** 2026-11-03  
**Project reviewed:** `apps/new_website`  
**Scope:** بررسی چهار URL داده‌شده برای یافتن skill قابل نصب و مناسب بازطراحی motion. هیچ تغییری در برنامه یا نصب skill انجام نشد.

## نتیجهٔ اصلی

دو صفحهٔ AgenticSkills و AI UX Playground یک skill واحد از Emil Kowalski را نمایش می‌دهند؛ UI Skills نیز همان skill را فهرست کرده است. منبع اصلی در مخزن عمومی [emilkowalski/skills](https://github.com/emilkowalski/skills) و مسیر `skills/animate/SKILL.md` است. AgenticSkills نسخهٔ همگام‌شده با commit `2d3b63a` در ۲ نوامبر ۲۰۲۶ را اعلام می‌کند و مجوز مخزن را MIT گزارش می‌کند. دستور نامزد نصب پروژه‌ای:

```text
npx skills add https://github.com/emilkowalski/skills --skill animate
```

دستور اجرا نشد. فایل‌های کامل skill و recipe در بیرون مخزن و در مسیرهای زیر ذخیره و خوانده شدند:

- `C:/Users/yazda/Documents/PORTFOLIO_DESIGN_DIGEST/skill_sources_20261103/web/emilkowalski-animate-SKILL.md`
- `C:/Users/yazda/Documents/PORTFOLIO_DESIGN_DIGEST/skill_sources_20261103/web/emilkowalski-animate-RECIPES.md`

صفحه‌های [AgenticSkills](https://agenticskills.io/skills/animate) و [AI UX Playground](https://aiuxplayground.com/skills/animate) کپی‌های فهرست‌ساز هستند؛ نصب دوباره یا کپی موازی لازم نیست. متن کامل راهنمای Emil ترتیب تصمیم‌گیری را از «آیا حرکت لازم است؟» و هدف آن تا انتخاب ابزار، property، easing، مدت، قطع‌پذیری، خروج و reduced motion مشخص می‌کند. Recipeها نمونه‌هایی برای modal، drawer، tooltip، dropdown، accordion، stagger و موارد دیگر دارند.

## تفکیک صفحات و گزینه‌ها

| صفحه | یافته | وضعیت نصب |
| --- | --- | --- |
| [agenticskills.io/skills/animate](https://agenticskills.io/skills/animate) | متن کامل Emil، لینک upstream و دستور نصب؛ commit `2d3b63a` و MIT را گزارش می‌کند. | منبع مناسب بررسی؛ نصب را هماهنگ‌کننده انجام دهد. |
| [aiuxplayground.com/skills/animate](https://aiuxplayground.com/skills/animate) | نسخهٔ همسان همان skill و recipeها. | تکراری؛ نصب جداگانه نشود. |
| [ui-skills.com/skills/motion](https://www.ui-skills.com/skills/motion) | فهرستی از چند skill؛ `animate` نوشتهٔ Emil تکرار منبع بالا است. `animate` نوشتهٔ pbakaus، skill متفاوتی از `pbakaus/impeccable` است. | Emil گزینهٔ اصلی. pbakaus اختیاری و مجوزش در این audit تأیید نشد. |
| [animateai.pro](https://animateai.pro/) | محصول وب تولید ویدئوی انیمیشنی، با تولید شخصیت، storyboard و video؛ فایل SKILL.md یا مخزن/دستور نصب skill پیدا نشد. بازشدن مستقیم یک بار timeout شد و متن بازاریابی از نمایهٔ جستجو بررسی شد. | skill قابل نصب نیست؛ حساب/پرداخت/آپلود انجام نشد. |

UI Skills همچنین یک skill مجزای `animation-performance` از همان مخزن Emil فهرست می‌کند. آن گزینه برای تشخیص مشخص افت فریم است و برای نصب اولیهٔ motion overhaul لازم نیست. skill متفاوت pbakaus بر «motion thesis»، حالت مخاطب و استفادهٔ بیانی‌تر از blur، mask، رنگ و material تأکید دارد؛ اگر انتخاب شود، پیش از نصب باید کل منبع و مجوز upstream جداگانه بررسی شود.

## ریسک‌ها و محدودیت‌ها

- در متن بررسی‌شدهٔ `SKILL.md` و `RECIPES.md` دستوری برای shell، npm script، telemetry یا فراخوانی خودکار سرویس خارجی وجود نداشت.
- فرمان `npx skills add` اجرا نشد؛ پیاده‌سازی CLI یا زنجیرهٔ وابستگی آن در این audit بررسی نشده است. پیش از نصب، روش رسمی و project-scoped مخزن را بررسی و نسخه/commit را pin کنید.
- متن skill حاوی دستور «پاسخ اولیه فقط یک جمله باشد» است. این صرفاً رفتار prompt فروشنده است و نباید بر دستور کاربر یا قرارداد پروژه مقدم شود.
- ادعاهای performance و بازه‌های زمانی ارائه‌شده، راهنمای عمومی‌اند. با tokenهای موجود، مرورگر هدف، دسترس‌پذیری و اندازه‌گیری واقعی تطبیق داده شوند.
- مجوز MIT برای مخزن Emil از صفحهٔ directory و صفحهٔ مخزن گزارش شده است؛ در نصب، attribution/license حفظ و در revision انتخابی دوباره تأیید شود.

## نقشهٔ کاربرد برای پروژه

- **رجیستری ۱۵ طراحی:** معیارها، tokenها و recipeهای تعامل را مشترک کنید؛ شخصیت بصری متفاوت هر طراحی را یکسان نکنید. انیمیشن‌های پرتکرار باید ناچیز یا بی‌حرکت باشند.
- **پس‌زمینه‌ها:** حرکت محیطی آرام، کم‌کنتراست و مستقل از تعامل بماند. حالت off/still و reduced-motion فعلی حفظ شود؛ replay در هر scroll یا محاسبهٔ جاوااسکریپتی در هر فریم اضافه نشود.
- **Morph داستان:** برای حرکت فضایی ease-in-out را با حفظ توپولوژی و nodeهای SVG موجود به کار ببرید و هنگام تغییر ورودی از وضعیت فعلی ادامه دهید. برای reduced-motion، جابه‌جایی را حذف و حالت ایستا/شفافیت معنادار نگه دارید.
- **Modal پروژه:** recipe نمونه از transform-origin مرکزی، opacity برای backdrop، scale محدود و خروج هماهنگ پیشنهاد می‌کند؛ نمونه ۲۵۰ms است. این skill جایگزین semantics و رفتار دسترس‌پذیر dialog، focus، Escape، scroll lock و click-away نیست.
- **تایپوگرافی:** opacity/transform محدود فقط برای معرفی موردی عنوان یا توضیح به‌کار رود. متن خواندنی یا داده را برای تزئین حرکت ندهید؛ revealهای تکراری اسکرول نسازید و tokenهای تایپوگرافی را حفظ کنید.

منبع ساختاریافته، مسیرهای کامل، مشخصات upstream و این نقشه در [ANIMATE_WEB_SOURCES.json](./ANIMATE_WEB_SOURCES.json) آمده است.
