/** Split a label into at most `maxLines` lines of about `max` characters (by words) — for SVG text. */
export function wrap(text: string, max: number, maxLines = 3): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if (line && (line + ' ' + w).length > max) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out.slice(0, maxLines);
}
