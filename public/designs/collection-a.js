(() => {
  const designs = [
    {
      id: 'atlas', name: 'اطلس', note: 'شبکه‌ای برای مسیرها و پیوندهای پژوهشی', family: 'شبکه',
      colors: ['#101d2a', '#8be0cd'], motion: 'مدار شناور و خطوط آرام',
      render(d, h) { return `<article class="hero hero-atlas"><div class="a-atlas-top"><span class="a-atlas-mark">FIELD / PROFILE</span>${h.location(d, 'a-atlas-place')}</div><div class="a-atlas-map" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></div><section class="a-atlas-copy">${h.name(d, 'a-atlas-name')}<div class="a-atlas-roles">${h.roles(d)}</div>${h.summary(d)}${h.actions()}</section><div class="a-atlas-portrait">${h.photo(d, 'a-atlas-photo')}<span class="a-atlas-orbit"></span><span class="a-atlas-node"></span></div><footer class="a-atlas-foot"><span>RESEARCH / PEOPLE / IDEAS</span><span>PROFILE</span></footer></article>`; }
    },
    {
      id: 'cinema', name: 'سینما', note: 'پرتره‌ای میان تیتر و افق سینمایی', family: 'روایی',
      colors: ['#151519', '#e7bc82'], motion: 'نور افق و شناوری تصویر',
      render(d, h) { return `<article class="hero hero-cinema"><div class="a-cinema-grain"></div><header class="a-cinema-head"><span>PORTRAIT / FILM</span>${h.location(d)}</header><div class="a-cinema-sky"></div><section class="a-cinema-title"><span class="a-cinema-kicker">A LIFE IN MOTION</span>${h.name(d, 'a-cinema-name')}<div class="a-cinema-roles">${h.roles(d)}</div></section><div class="a-cinema-frame">${h.photo(d, 'a-cinema-photo')}<span>FRAME 01</span></div><div class="a-cinema-horizon"></div><section class="a-cinema-lower">${h.summary(d)}${h.actions()}</section></article>`; }
    },
    {
      id: 'studio', name: 'استودیو', note: 'پوستر استودیویی با رنگ گرم و تایپ قاطع', family: 'پوستر',
      colors: ['#f2eee4', '#f15b31'], motion: 'ورود لایه‌های پوستر',
      render(d, h) { return `<article class="hero hero-studio"><header class="a-studio-head"><span>STUDIO NOTES</span><span>VOL. 01</span></header><div class="a-studio-stage"><div class="a-studio-type">${h.name(d, 'a-studio-name')}<div class="a-studio-roles">${h.roles(d)}</div></div><div class="a-studio-cut">${h.photo(d, 'a-studio-photo')}<span class="a-studio-sticker">IN<br>FOCUS</span></div><span class="a-studio-vertical">PEOPLE / PRACTICE / PLACE</span></div><div class="a-studio-bottom"><div class="a-studio-rule"></div>${h.location(d)}${h.summary(d)}${h.actions()}</div></article>`; }
    },
    {
      id: 'editorial', name: 'ادیتوریال', note: 'صفحه‌ای از یک ژورنال پژوهشی', family: 'ژورنال',
      colors: ['#e9e3d8', '#a5503c'], motion: 'حرکت نرم ستون تصویر',
      render(d, h) { return `<article class="hero hero-editorial"><header class="a-editorial-mast"><span>THE RESEARCH JOURNAL</span><span>PROFILE / 01</span></header><div class="a-editorial-folio"><span>FIELD<br>NOTES</span><b>01</b></div><section class="a-editorial-main"><div class="a-editorial-copy"><span class="a-editorial-kicker">A PRACTICE IN CONTEXT</span>${h.name(d, 'a-editorial-name')}<div class="a-editorial-roles">${h.roles(d)}</div><div class="a-editorial-meta">${h.location(d)}</div>${h.summary(d)}${h.actions()}</div><div class="a-editorial-portrait">${h.photo(d, 'a-editorial-photo')}<span>FIG. 01</span></div></section><footer class="a-editorial-foot"><span>PEOPLE &amp; PLACES</span><span>PROFILE / STUDY</span></footer></article>`; }
    },
    {
      id: 'terminal', name: 'ترمینال', note: 'نمایشگر کد با پرتره زیر اسکن‌لاین', family: 'دیجیتال',
      colors: ['#07140f', '#8af2bd'], motion: 'آشکارشدن پله‌ای نقش‌ها',
      render(d, h) { return `<article class="hero hero-terminal"><header class="a-terminal-bar"><span class="a-terminal-lights">● ● ●</span><span>profile.runtime</span><span>JSON</span></header><div class="a-terminal-grid"><section class="a-terminal-copy"><span class="a-terminal-prompt">$ whoami --verbose</span>${h.name(d, 'a-terminal-name')}<div class="a-terminal-roles">${h.roles(d)}</div><div class="a-terminal-location">${h.location(d)}</div>${h.summary(d)}${h.actions()}</section><aside class="a-terminal-aside"><div class="a-terminal-photo">${h.photo(d, 'a-terminal-image')}<span class="a-terminal-scan"></span><span class="a-terminal-cross">+</span></div><span class="a-terminal-caption">[ portrait: JSON ]</span></aside></div><footer class="a-terminal-foot"><span>SYS / PERSONA</span><span>EOF</span></footer></article>`; }
    },
    {
      id: 'swiss', name: 'سوئیس', note: 'شبکه‌ی دقیق با تاکید بر تصویر و فضای سفید', family: 'مدرن',
      colors: ['#f7f7f4', '#1749d0'], motion: 'گشوده‌شدن هندسی قاب',
      render(d, h) { return `<article class="hero hero-swiss"><header class="a-swiss-top"><span>PEOPLE / 01</span><span>PROFILE INDEX</span>${h.location(d)}</header><div class="a-swiss-grid"><section class="a-swiss-copy"><span class="a-swiss-no">01</span>${h.name(d, 'a-swiss-name')}<div class="a-swiss-roles">${h.roles(d)}</div><div class="a-swiss-line"></div>${h.summary(d)}${h.actions()}</section><div class="a-swiss-image">${h.photo(d, 'a-swiss-photo')}<span class="a-swiss-wipe"></span><b>FIG—01</b></div></div><footer class="a-swiss-bottom"><span>RESEARCH / DESIGN / CULTURE</span><span>CHAPTER 01</span></footer></article>`; }
    },
    {
      id: 'gallery', name: 'گالری', note: 'پرتره‌ای آرام در قاب موزه‌ای', family: 'گالری',
      colors: ['#e6e1d6', '#3d3731'], motion: 'حرکت آهسته‌ی تصویر در قاب',
      render(d, h) { return `<article class="hero hero-gallery"><header class="a-gallery-head"><span>ROOM 01</span><span>PORTRAITS OF PRACTICE</span></header><div class="a-gallery-wall"><div class="a-gallery-mat">${h.photo(d, 'a-gallery-photo')}</div><div class="a-gallery-shadow"></div></div><section class="a-gallery-label"><span class="a-gallery-dot"></span><div class="a-gallery-info"><span class="a-gallery-kicker">PORTRAIT / STUDY</span>${h.name(d, 'a-gallery-name')}<div class="a-gallery-roles">${h.roles(d)}</div>${h.location(d)}${h.summary(d)}${h.actions()}</div><div class="a-gallery-index">01<br><small>STUDY</small></div></section></article>`; }
    }
  ];
  window.HeroLabDesigns = [...(window.HeroLabDesigns || []), ...designs];
})();
