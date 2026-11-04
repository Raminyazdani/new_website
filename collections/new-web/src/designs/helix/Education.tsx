'use client';

import { motion } from 'motion/react';
import { Award, GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Marquee } from '@/components/magicui/marquee';
import { Reveal } from '@/components/shared/Reveal';
import { fmtNum, fmtYear } from '@/lib/format';
import type { Certification, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SectionHeader } from './ui';

function CertCard({ c, locale }: { c: Certification; locale: string }) {
  const t = useTranslations('common');
  const body = (
    <div className="flex h-full w-72 flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#070c17] p-4 transition hover:border-[#2ee6c5]/40">
      <p lang="en" dir="ltr" className="text-sm font-medium leading-snug text-[#dbe8f2]">
        {c.name}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-[#7f97ad]">
        <span lang="en" dir="ltr" className="truncate">{c.issuer}</span>
        <span className="flex shrink-0 items-center gap-2 font-mono">
          {c.hours ? t('hours', { count: fmtNum(locale, c.hours) }) : c.weeks ? t('weeks', { count: fmtNum(locale, c.weeks) }) : null}
          {c.year && <span>· {fmtYear(locale, c.year)}</span>}
          {c.certificate && <Award className="size-3.5 text-[#ffb547]" aria-label={t('certificate')} />}
        </span>
      </div>
    </div>
  );
  return c.url ? (
    <a href={c.url} target="_blank" rel="noreferrer" title={t('certificateLink')}>
      {body}
    </a>
  ) : (
    body
  );
}

export function Education({ data }: { data: SiteData }) {
  const t = useTranslations();
  const english = data.languages.find((l) => l.cert);
  const half = Math.ceil(data.certifications.length / 2);

  return (
    <section id="education" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeader index={6} kicker={t('sections.education.kicker')} title={t('sections.education.title')} />

        <div className="grid gap-5 md:grid-cols-3">
          {data.education.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.08}>
              <article
                className={cn(
                  'relative h-full rounded-3xl border p-7',
                  e.current ? 'border-[#2ee6c5]/30 bg-gradient-to-b from-[#0a2422] to-[#070c17]' : 'border-white/[0.08] bg-[#070c17]/70',
                )}
              >
                <GraduationCap className={cn('mb-6 size-7', e.current ? 'text-[#2ee6c5]' : 'text-[#6f879c]')} />
                <p className="font-mono text-xs text-[#2ee6c5]">{e.period}</p>
                <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-white">{e.degree}</h3>
                <p className="mt-2 text-sm text-[#b6c7d6]">{e.institution}</p>
                <p className="mt-1 text-xs text-[#6f879c]">{e.location}</p>
                {e.gpa && (
                  <p className="mt-5 inline-flex rounded-full bg-white/[0.05] px-3 py-1 font-mono text-xs text-[#cfe3f2]">
                    {t('common.gpa')} <span className="ml-2 rtl:ml-0 rtl:mr-2" dir="ltr">{e.gpa}</span>
                  </p>
                )}
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <h3 className="font-display text-2xl font-semibold text-white">{t('sections.languages.title')}</h3>
            {english?.cert && (
              <div className="mt-6 rounded-3xl border border-white/[0.08] bg-[#070c17]/70 p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-[#dbe8f2]">
                    {english.name} <span className="text-sm text-[#7f97ad]">· {english.cert.test}</span>
                  </p>
                  <p className="font-display text-4xl font-semibold text-[#2ee6c5]">{fmtNum(data.locale, english.cert.overall, { minimumFractionDigits: 1 })}</p>
                </div>
                <ul className="mt-5 space-y-3">
                  {(['reading', 'listening', 'speaking', 'writing'] as const).map((k, i) => {
                    const v = english.cert!.bands[k];
                    return (
                      <li key={k} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                        <span className="text-[#8ea3b7]">{t(`ielts.${k}`)}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.span
                            className="block h-full rounded-full bg-gradient-to-r from-[#2ee6c5] to-[#4cc9f0] rtl:bg-gradient-to-l"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(v / english.cert!.max) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </span>
                        <span className="text-end font-mono text-[#cfe3f2]">{fmtNum(data.locale, v, { minimumFractionDigits: 1 })}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.languages
                .filter((l) => !l.cert)
                .map((l) => (
                  <li key={l.id} className="rounded-2xl border border-white/[0.08] bg-[#070c17]/70 p-4">
                    <p className="text-[#dbe8f2]">{l.name}</p>
                    <p className="mt-1 text-sm text-[#7f97ad]">{l.level}</p>
                  </li>
                ))}
            </ul>
          </Reveal>

          <Reveal>
            <h3 className="font-display text-2xl font-semibold text-white">{t('sections.certifications.title')}</h3>
            <p className="mt-2 text-[#8ea3b7]">
              {t('sections.certifications.subtitle', {
                count: fmtNum(data.locale, data.certStats.count),
                hours: fmtNum(data.locale, data.certStats.hours),
                issuers: fmtNum(data.locale, data.certStats.issuers.length),
              })}
            </p>
            <div className="mt-6 space-y-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]" dir="ltr">
              <Marquee pauseOnHover className="[--duration:90s] [--gap:0.75rem] p-0">
                {data.certifications.slice(0, half).map((c) => (
                  <CertCard key={c.name + c.issuer} c={c} locale={data.locale} />
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover className="[--duration:90s] [--gap:0.75rem] p-0">
                {data.certifications.slice(half).map((c) => (
                  <CertCard key={c.name + c.issuer} c={c} locale={data.locale} />
                ))}
              </Marquee>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
