'use client';

import { Code2, Languages, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BorderBeam } from '@/components/magicui/border-beam';
import { Marquee } from '@/components/magicui/marquee';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { TextReveal } from '@/components/magicui/text-reveal';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { Reveal } from '@/components/shared/Reveal';
import { fmtYear, numberLocale } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { BASE_COLORS, SectionHeader, sequence } from './ui';

export function SequenceStrip({ reverse = false }: { reverse?: boolean }) {
  const seq = sequence(90, reverse ? 9 : 4);
  return (
    <div dir="ltr" className="relative border-y border-white/[0.06] bg-[#050913] py-3 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <Marquee reverse={reverse} className="[--duration:60s] [--gap:0rem]" repeat={2}>
        <div className="flex font-mono text-sm tracking-[0.35em]">
          {seq.map((b, i) => (
            <span key={i} style={{ color: BASE_COLORS[b] }} className="opacity-60">
              {b}
            </span>
          ))}
        </div>
      </Marquee>
    </div>
  );
}

export function About({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = numberLocale(data.locale);
  const stats = data.stats.filter((s) => ['repos', 'mpi', 'courses', 'hours'].includes(s.id));

  return (
    <section id="about" className="relative">
      <div className="mx-auto max-w-7xl px-6 pt-32 sm:px-10">
        <SectionHeader index={1} kicker={t('sections.about.kicker')} title={t('helix.statement')} />
      </div>

      <TextReveal className="-mt-24 h-[170vh]" textClassName="font-display !text-3xl font-medium leading-snug text-white sm:!text-4xl lg:!text-5xl">
        {data.person.statement}
      </TextReveal>

      <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-32 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal className="relative">
          <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-[#081120] lg:mx-0">
            <ProfilePhoto
              src={data.person.photo}
              alt={t('common.photoAlt')}
              size={720}
              className="size-full"
              imgClassName="grayscale-[35%] contrast-[1.05] transition duration-700 hover:grayscale-0"
              monogramClassName="font-display text-6xl text-white/80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#04060c] via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="font-display text-2xl font-semibold text-white">{data.person.displayName}</p>
              <p className="mt-1 text-sm text-[#9fb3c8]">{data.person.status}</p>
            </div>
            <BorderBeam size={260} duration={9} colorFrom="#2ee6c5" colorTo="#4cc9f0" borderWidth={1.5} />
            <BorderBeam size={260} duration={9} delay={4.5} colorFrom="#ffb547" colorTo="#ff5c8a" borderWidth={1.5} />
          </div>
          <ul className="mx-auto mt-6 grid max-w-sm gap-3 text-sm text-[#b6c7d6] lg:mx-0">
            <li className="flex items-center gap-3">
              <MapPin className="size-4 text-[#2ee6c5]" />
              <span className="text-[#6f879c]">{t('helix.basedIn')}</span> {data.person.location}
            </li>
            <li className="flex items-center gap-3">
              <Languages className="size-4 text-[#2ee6c5]" />
              <span className="text-[#6f879c]">{t('sections.languages.title')}</span> {data.languages.map((l) => l.name).join(' · ')}
            </li>
            <li className="flex items-center gap-3">
              <Code2 className="size-4 text-[#2ee6c5]" />
              <span className="text-[#6f879c]">{t('helix.since')}</span> {fmtYear(data.locale, 2018)}
            </li>
          </ul>
        </Reveal>

        <div>
          <div className="space-y-6 text-lg leading-relaxed text-[#a9bccd]">
            {data.person.about.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.06} className="bg-[#060a14] p-6">
                <p className="font-display text-4xl font-semibold text-white">
                  <NumberTicker value={s.value} locale={loc} className="text-white" />
                  <span className="text-[#2ee6c5]">{s.suffix}</span>
                </p>
                <p className="mt-2 text-xs leading-snug text-[#7f97ad]">{s.label}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#6f879c]">{t('helix.softSkills')}</p>
            <div className="flex flex-wrap gap-2">
              {data.softSkills.map((s) => (
                <span key={s.key} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-[#c4d4e1]">
                  {s.name}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
