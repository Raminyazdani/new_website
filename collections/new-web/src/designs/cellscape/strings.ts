const en = {
  title: 'Portfolio workspace', subtitle: 'An atlas of work, methods and training', filter: 'Record types', inspect: 'Inspector',
  all: 'All records', map: 'Topic map', chronology: 'Chronology', table: 'Records', search: 'Find a record…', clear: 'Clear search',
  profile: 'Profile', project: 'Projects', skill: 'Skills', course: 'Courses', position: 'Experience', publication: 'Publications', education: 'Education', language: 'Languages',
  biology: 'Computational biology', software: 'Software & data', laboratory: 'Laboratory methods', training: 'Courses & certificates', career: 'Roles & education', literature: 'Literature', other: 'Other methods', identity: 'Profile & languages',
  counts: 'Matching records', selected: 'Selected record', select: 'Select a record on the map or in the index.',
  note: 'Conceptual map. Positions are editorial, not measured similarities.', timeNote: 'Dated records use their start or publication year; all others are grouped separately.',
  noYear: 'Undated', allYears: 'All years', year: 'Year', noMatches: 'No records match these filters.', reset: 'Reset filters',
  plus: 'Zoom in', minus: 'Zoom out', fit: 'Fit map', center: 'Center selected record', view: 'Map views', legend: 'Legend',
  role: 'Details', links: 'Links', related: 'Same topic', date: 'Date', titleField: 'Record', hours: 'Hours', weeks: 'Weeks',
  status: 'Status', publisher: 'Publisher', reading: 'Reading', listening: 'Listening', writing: 'Writing', speaking: 'Speaking', locale: 'Language',
};
const de: typeof en = {
  title: 'Portfolio-Arbeitsfläche', subtitle: 'Ein Atlas für Arbeit, Methoden und Weiterbildung', filter: 'Eintragstypen', inspect: 'Details',
  all: 'Alle Einträge', map: 'Themenkarte', chronology: 'Zeitleiste', table: 'Einträge', search: 'Eintrag suchen…', clear: 'Suche löschen',
  profile: 'Profil', project: 'Projekte', skill: 'Kenntnisse', course: 'Kurse', position: 'Erfahrung', publication: 'Publikationen', education: 'Ausbildung', language: 'Sprachen',
  biology: 'Computational Biology', software: 'Software & Daten', laboratory: 'Labormethoden', training: 'Kurse & Zertifikate', career: 'Positionen & Ausbildung', literature: 'Literatur', other: 'Weitere Methoden', identity: 'Profil & Sprachen',
  counts: 'Passende Einträge', selected: 'Ausgewählter Eintrag', select: 'Einen Eintrag auf der Karte oder in der Liste auswählen.',
  note: 'Konzeptkarte. Die Positionen folgen einer redaktionellen Anordnung.', timeNote: 'Datierte Einträge stehen nach Start- oder Publikationsjahr. Die übrigen sind separat gruppiert.',
  noYear: 'Undatiert', allYears: 'Alle Jahre', year: 'Jahr', noMatches: 'Keine Einträge für diese Filter.', reset: 'Filter zurücksetzen',
  plus: 'Vergrößern', minus: 'Verkleinern', fit: 'Karte einpassen', center: 'Auswahl zentrieren', view: 'Kartenansichten', legend: 'Legende',
  role: 'Details', links: 'Links', related: 'Gleiches Thema', date: 'Datum', titleField: 'Eintrag', hours: 'Stunden', weeks: 'Wochen',
  status: 'Status', publisher: 'Verlag', reading: 'Lesen', listening: 'Hören', writing: 'Schreiben', speaking: 'Sprechen', locale: 'Sprache',
};
const fa: typeof en = {
  title: 'فضای کار پورتفولیو', subtitle: 'اطلس کار، روش‌ها و آموزش', filter: 'انواع رکورد', inspect: 'جزئیات',
  all: 'همهٔ رکوردها', map: 'نقشهٔ موضوعی', chronology: 'خط زمانی', table: 'رکوردها', search: 'جست‌وجوی رکورد…', clear: 'پاک کردن جست‌وجو',
  profile: 'پروفایل', project: 'پروژه‌ها', skill: 'مهارت‌ها', course: 'دوره‌ها', position: 'سوابق', publication: 'انتشارات', education: 'تحصیلات', language: 'زبان‌ها',
  biology: 'زیست‌شناسی محاسباتی', software: 'نرم‌افزار و داده', laboratory: 'روش‌های آزمایشگاهی', training: 'دوره‌ها و گواهی‌ها', career: 'سوابق و تحصیلات', literature: 'انتشارات', other: 'روش‌های دیگر', identity: 'پروفایل و زبان‌ها',
  counts: 'رکوردهای پیدا شده', selected: 'رکورد انتخاب‌شده', select: 'رکوردی را روی نقشه یا در فهرست انتخاب کنید.',
  note: 'نقشهٔ مفهومی است. جایگاه‌ها چیدمان موضوعی‌اند و شباهت اندازه‌گیری‌شده نیستند.', timeNote: 'رکوردهای تاریخ‌دار بر اساس سال شروع یا انتشار چیده شده‌اند. بقیه جدا هستند.',
  noYear: 'بدون تاریخ', allYears: 'همهٔ سال‌ها', year: 'سال', noMatches: 'رکوردی با این فیلترها پیدا نشد.', reset: 'پاک کردن فیلترها',
  plus: 'بزرگ‌نمایی', minus: 'کوچک‌نمایی', fit: 'نمای کامل نقشه', center: 'مرکز روی رکورد انتخابی', view: 'نماهای نقشه', legend: 'راهنما',
  role: 'جزئیات', links: 'پیوندها', related: 'موضوع مشترک', date: 'تاریخ', titleField: 'رکورد', hours: 'ساعت', weeks: 'هفته',
  status: 'وضعیت', publisher: 'ناشر', reading: 'خواندن', listening: 'شنیدن', writing: 'نوشتن', speaking: 'گفتن', locale: 'زبان',
};
export const cellStrings = { en, de, fa };
export type CellStrings = typeof en;
