(() => {
  const H = window.HeroLabDesigns = window.HeroLabDesigns || [];
  const esc = (h, s) => h.e(s);
  const defs = [
    {
      id: 'orbital', name: 'مدار مرواریدی', note: 'چهره در مرکز یک صحنهٔ روشن و حلقه‌های مداری', family: 'فضایی', colors: ['#f3f0e9', '#b58b62'], motion: 'چرخش آرام حلقه‌ها',
      render(d, h) { return `<article class="hero hero-orbital"><div class="orbital-top"><span>PERSONAL / PROFILE</span>${h.location(d, 'orbital-place')}</div><div class="orbital-stage"><div class="orbital-ring ring-one"></div><div class="orbital-ring ring-two"></div><div class="orbital-ring ring-three"></div><div class="orbital-core">${h.photo(d, 'orbital-photo')}</div><span class="orbital-tag tag-a">${esc(h, d.firstName || d.name || '')}</span><span class="orbital-tag tag-b">${esc(h, d.location || '')}</span></div><div class="orbital-bottom"><div class="orbital-title">${h.name(d, 'orbital-name')}<div class="orbital-roles">${h.roles(d)}</div></div><div class="orbital-copy">${h.summary(d, 'orbital-summary')}</div></div>${h.actions()}</article>`; }
    },
    {
      id: 'noir', name: 'مجلهٔ نوآر', note: 'صفحه‌ای تک‌رنگ با پرترهٔ بلند و حروف دورخط', family: 'مجله‌ای', colors: ['#121212', '#ece8df'], motion: 'درخشش آهستهٔ عنوان',
      render(d, h) { return `<article class="hero hero-noir"><div class="noir-mast"><span>THE PROFILE ISSUE</span><span>01 — ${esc(h, d.location || '')}</span></div><div class="noir-frame"><div class="noir-outline">PROFILE</div><div class="noir-image">${h.photo(d, 'noir-photo')}</div><div class="noir-index">PORTRAIT / PERSONAL</div></div><div class="noir-foot"><div class="noir-identity">${h.name(d, 'noir-name')}<div class="noir-roles">${h.roles(d)}</div></div><div class="noir-bio">${h.summary(d, 'noir-summary')}</div></div>${h.actions()}</article>`; }
    },
    {
      id: 'bento', name: 'بنتوی هویت', note: 'شبکهٔ نامتقارن از تصویر، نقش‌ها و اطلاعات هویتی', family: 'شبکه‌ای', colors: ['#e8e9e2', '#d7f35c'], motion: 'جابجایی نرم کارت‌ها',
      render(d, h) { return `<article class="hero hero-bento"><header class="bento-head"><span>PERSONAL DASHBOARD</span>${h.location(d)}</header><div class="bento-grid"><section class="bento-tile bento-portrait">${h.photo(d, 'bento-photo')}<span class="tile-caption">PORTRAIT</span></section><section class="bento-tile bento-name">${h.name(d, 'bento-title')}<div class="bento-roles">${h.roles(d)}</div><span class="tile-caption">IDENTITY</span></section><section class="bento-tile bento-summary">${h.summary(d, 'bento-bio')}<span class="tile-caption">ABOUT</span></section><section class="bento-tile bento-position"><span class="bento-mark">✳</span><span>PROFILE<br>COLLECTION</span></section></div>${h.actions()}</article>`; }
    },
    {
      id: 'kinetic', name: 'نوارهای گیلاسی', note: 'حرکت نوارهای نام در کنار پرترهٔ ثابت و خوانا', family: 'تایپوگرافیک', colors: ['#f7f4ee', '#e34a42'], motion: 'لغزش نوارها',
      render(d, h) { return `<article class="hero hero-kinetic"><div class="kinetic-top"><span>NAME / ROLE</span>${h.location(d)}</div><div class="kinetic-body"><div class="kinetic-photo">${h.photo(d, 'kinetic-image')}<span class="kinetic-dot"></span></div><div class="kinetic-type"><div class="kinetic-band band-one">${esc(h, d.name || '')}</div><div class="kinetic-band band-two">${esc(h, d.name || '')}</div>${h.name(d, 'kinetic-readable')}<div class="kinetic-roles">${h.roles(d)}</div><div class="kinetic-summary">${h.summary(d, 'kinetic-bio')}</div></div></div><div class="kinetic-bottom">IN MOTION <span>—</span> PERSONAL PROFILE</div>${h.actions()}</article>`; }
    },
    {
      id: 'blueprint', name: 'نقشهٔ آبی', note: 'ترسیم فنی با خطوط راهنما دور پرترهٔ حکاکی‌شده', family: 'نقشه‌کشی', colors: ['#1026d4', '#c5ff49'], motion: 'رسم تدریجی خطوط',
      render(d, h) { return `<article class="hero hero-blueprint"><div class="blueprint-grid"></div><header class="blueprint-head"><span>FIG. 01 / IDENTITY STUDY</span>${h.location(d)}</header><div class="blueprint-layout"><div class="blueprint-photo-wrap"><svg class="blueprint-leaders" viewBox="0 0 400 430" aria-hidden="true"><path d="M8 64H83L113 94M392 134H318L292 160M12 354H86L121 326M390 300H320L292 276"/><circle cx="113" cy="94" r="4"/><circle cx="292" cy="160" r="4"/><circle cx="121" cy="326" r="4"/><circle cx="292" cy="276" r="4"/></svg>${h.photo(d, 'blueprint-photo')}<span class="blueprint-cross cross-a">＋</span><span class="blueprint-cross cross-b">＋</span></div><div class="blueprint-info"><span class="blueprint-kicker">SUBJECT</span>${h.name(d, 'blueprint-name')}<div class="blueprint-roles">${h.roles(d)}</div><div class="blueprint-rule"></div>${h.summary(d, 'blueprint-summary')}</div></div><div class="blueprint-foot"><span>ORTHOGRAPHIC PORTRAIT</span><span>01 / 07</span></div>${h.actions()}</article>`; }
    },
    {
      id: 'glass', name: 'پنجرهٔ شیشه‌ای', note: 'پنجرهٔ شفاف روی هاله‌ای رنگین و نرم', family: 'دیجیتال', colors: ['#d9e3e7', '#a18aff'], motion: 'لغزش نور روی شیشه',
      render(d, h) { return `<article class="hero hero-glass"><div class="glass-aurora"></div><div class="glass-window"><div class="glass-bar"><span class="glass-dots"><i></i><i></i><i></i></span><span>PROFILE WINDOW</span><span>•••</span></div><div class="glass-content"><div class="glass-person">${h.photo(d, 'glass-photo')}<div class="glass-caption">PORTRAIT / 01</div></div><div class="glass-details">${h.name(d, 'glass-name')}<div class="glass-roles">${h.roles(d)}</div>${h.location(d)}<div class="glass-divider"></div>${h.summary(d, 'glass-summary')}</div></div></div>${h.actions()}</article>`; }
    },
    {
      id: 'index', name: 'فهرست آرام', note: 'دایرکتوری مینیمال با حروف گرم و فضای باز', family: 'مینیمال', colors: ['#f2eee5', '#756b5d'], motion: 'خطوط ظریف متحرک',
      render(d, h) { return `<article class="hero hero-index"><header class="index-header"><span>PERSONAL DIRECTORY</span><span>ENTRY&nbsp; / &nbsp;01</span></header><div class="index-rule"></div><div class="index-main"><div class="index-portrait">${h.photo(d, 'index-photo')}<span>01</span></div><div class="index-text"><span class="index-label">NAME</span>${h.name(d, 'index-name')}<div class="index-spacer"></div><span class="index-label">ROLES</span><div class="index-roles">${h.roles(d)}</div><span class="index-label index-about-label">ABOUT</span>${h.summary(d, 'index-summary')}</div></div><footer class="index-footer"><span>PROFILE INDEX</span>${h.location(d)}</footer>${h.actions()}</article>`; }
    }
  ];
  H.push(...defs);
})();
