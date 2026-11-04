'use client';

import { useEffect, useMemo, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { Command } from 'cmdk';
import { useTranslations } from 'next-intl';
import { Award, BookOpen, Briefcase, FileText, GraduationCap, Languages, Monitor, Moon, RotateCcw, Search, SlidersHorizontal, Sun } from 'lucide-react';
import { useLocaleSwitch } from '@/components/shared/useLocaleSwitch';
import { allProjects } from '@/lib/derive';
import type { SiteData } from '@/lib/types';
import { APP, LAUNCH_ORDER, type AppId } from './apps';
import { fold } from './apps/ui';
import type { Theme } from './wm';

/** word-prefix / substring match (cmdk's default fuzzy score lets "seurat" match unrelated titles) */
function filter(value: string, search: string) {
  const v = fold(value);
  const words = fold(search).trim().split(/\s+/).filter(Boolean);
  let score = 1;
  for (const w of words) {
    const i = v.indexOf(w);
    if (i < 0) return 0;
    score += i === 0 || /[\s\-_/(·—]/.test(v[i - 1]) ? 1 : 0.4;
  }
  return score;
}

/**
 * Spotlight (Ctrl/⌘ K): one search over apps, actions and every item of the CV — projects, roles,
 * degrees, papers, skills, courses, languages. Choosing an item opens its app at that item.
 */
export function Spotlight({
  data,
  onClose,
  onOpen,
  onTheme,
  onReset,
}: {
  data: SiteData;
  onClose: () => void;
  onOpen: (app: AppId, id?: string) => void;
  onTheme: (t: Theme) => void;
  onReset: () => void;
}) {
  const t = useTranslations();
  const { locales, switchTo, locale } = useLocaleSwitch();
  const box = useRef<HTMLDivElement>(null);
  const projects = useMemo(() => allProjects(data), [data]);
  const skills = useMemo(() => data.skills.flatMap((c) => c.groups.flatMap((g) => g.items.map((it) => ({ uid: `${g.id}/${it.key}`, name: it.name, long: it.long, group: g.label })))), [data.skills]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const run = (fn: () => void) => {
    onClose();
    window.setTimeout(fn, 0);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault(); // the search field is the only stop; ↑ ↓ move through the results
    }
  };
  const group = (key: string) => t(`desktop.spotlight.groups.${key}`);

  return (
    <div className="dt-spot-backdrop" onPointerDown={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={t('desktop.spotlight.label')} className="dt-spot" onPointerDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <Command label={t('desktop.spotlight.label')} loop filter={filter}>
          <div className="dt-spot-input">
            <Search className="size-5 shrink-0 opacity-60" aria-hidden />
            <Command.Input autoFocus placeholder={t('desktop.spotlight.placeholder')} />
          </div>
          <Command.List className="dt-spot-list">
            <Command.Empty className="dt-empty">{t('common.noResults')}</Command.Empty>
            <Command.Group heading={group('apps')}>
              {LAUNCH_ORDER.map((id) => {
                const Icon = APP[id].icon;
                return (
                  <Command.Item key={id} value={`app ${id} ${t(`desktop.apps.${id}`)}`} onSelect={() => run(() => onOpen(id))}>
                    <span className="dt-tile dt-tile-xs" style={{ '--a': APP[id].from, '--b': APP[id].to } as CSSProperties} aria-hidden>
                      <Icon className="size-3" />
                    </span>
                    {t(`desktop.apps.${id}`)}
                  </Command.Item>
                );
              })}
            </Command.Group>
            <Command.Group heading={group('actions')}>
              <Command.Item value={`document ${t('desktop.menu.document')}`} onSelect={() => run(() => (window.location.hash = 'document'))}>
                <FileText className="size-4" aria-hidden /> {t('desktop.menu.document')}
              </Command.Item>
              <Command.Item value={`theme light ${t('desktop.settings.light')}`} onSelect={() => run(() => onTheme('light'))}>
                <Sun className="size-4" aria-hidden /> {t('desktop.settings.light')}
              </Command.Item>
              <Command.Item value={`theme dark ${t('desktop.settings.dark')}`} onSelect={() => run(() => onTheme('dark'))}>
                <Moon className="size-4" aria-hidden /> {t('desktop.settings.dark')}
              </Command.Item>
              <Command.Item value={`reset ${t('desktop.menu.reset')}`} onSelect={() => run(onReset)}>
                <RotateCcw className="size-4" aria-hidden /> {t('desktop.menu.reset')}
              </Command.Item>
              {locales
                .filter((l) => l.code !== locale)
                .map((l) => (
                  <Command.Item key={l.code} value={`language ${l.code} ${l.native}`} onSelect={() => run(() => switchTo(l.code))}>
                    <Languages className="size-4" aria-hidden /> <span lang={l.code}>{l.native}</span>
                  </Command.Item>
                ))}
            </Command.Group>
            <Command.Group heading={group('projects')}>
              {projects.map((p) => (
                <Command.Item key={p.id} value={`project ${p.id} ${p.title} ${p.tags.join(' ')}`} onSelect={() => run(() => onOpen('projects', p.id))}>
                  <Monitor className="size-4 shrink-0" aria-hidden />
                  <span className="truncate" dir="auto">
                    {p.title}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={group('roles')}>
              {data.experiences.map((e) => (
                <Command.Item key={e.id} value={`role ${e.id} ${e.role} ${e.org}`} onSelect={() => run(() => onOpen('experience', e.id))}>
                  <Briefcase className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">
                    {e.role} — {e.org}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={group('education')}>
              {data.education.map((e) => (
                <Command.Item key={e.id} value={`degree ${e.id} ${e.degree} ${e.institution}`} onSelect={() => run(() => onOpen('education'))}>
                  <GraduationCap className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{e.degree}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={group('papers')}>
              {data.publications.map((p) => (
                <Command.Item key={p.id} value={`paper ${p.id} ${p.title}`} onSelect={() => run(() => onOpen('papers', p.id))}>
                  <BookOpen className="size-4 shrink-0" aria-hidden />
                  <bdi lang="en" className="truncate">
                    {p.title}
                  </bdi>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={group('skills')}>
              {skills.map((s) => (
                <Command.Item key={s.uid} value={`skill ${s.uid} ${s.name} ${s.long} ${s.group}`} onSelect={() => run(() => onOpen('skills', s.uid))}>
                  <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
                  <bdi className="truncate">{s.name}</bdi>
                  <span className="dt-muted ms-auto truncate text-[12px]">{s.group}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={group('courses')}>
              {data.certifications.map((c, i) => (
                <Command.Item key={i} value={`course ${i} ${c.name} ${c.issuer}`} onSelect={() => run(() => onOpen('courses', String(i)))}>
                  <Award className="size-4 shrink-0" aria-hidden />
                  <bdi className="truncate" dir="auto">
                    {c.name}
                  </bdi>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={group('languages')}>
              {data.languages.map((l) => (
                <Command.Item key={l.id} value={`language-skill ${l.id} ${l.name} ${l.level}`} onSelect={() => run(() => onOpen('languages'))}>
                  <Languages className="size-4 shrink-0" aria-hidden />
                  {l.name}
                  <span className="dt-muted ms-auto text-[12px]">{l.level}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
        <p className="dt-spot-foot" aria-hidden>
          <kbd>↑</kbd>
          <kbd>↓</kbd> {t('desktop.spotlight.move')} <kbd>↵</kbd> {t('desktop.spotlight.choose')} <kbd>Esc</kbd> {t('common.close')}
        </p>
      </div>
    </div>
  );
}
