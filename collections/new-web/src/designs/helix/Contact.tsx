'use client';

import { ArrowUpRight, Check, Copy, Mail, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { Reveal } from '@/components/shared/Reveal';
import { fmtYear, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { HelixMark } from './Nav';

export function Contact({ data }: { data: SiteData }) {
  const t = useTranslations();
  const links = [
    { id: 'github', label: 'GitHub', href: data.links.github },
    { id: 'linkedin', label: 'LinkedIn', href: data.links.linkedin },
    { id: 'orcid', label: 'ORCID', href: data.links.orcid },
    { id: 'scholar', label: 'Scholar', href: data.links.scholar },
  ].filter((l) => l.href);

  return (
    <section id="contact" className="relative isolate overflow-hidden pb-40 pt-40">
      <div className="hx-aurora -z-10" aria-hidden>
        <span className="start-[2%] top-[-4%] size-[52rem] bg-[radial-gradient(closest-side,#2ee6c5,transparent)]" />
        <span className="end-[0%] top-[-8%] size-[46rem] bg-[radial-gradient(closest-side,#4cc9f0,transparent)] [animation-delay:-6s]" />
        <span className="start-[32%] top-[14%] size-[36rem] bg-[radial-gradient(closest-side,#ffb547,transparent)] opacity-60 [animation-delay:-11s]" />
      </div>
      <div className="hx-grid absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent)]" />

      <div className="mx-auto max-w-5xl px-6 text-center sm:px-10">
        <Reveal>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-[#2ee6c5]">
            <span dir="ltr">{seqNo(data.locale, 7)}</span> · {t('sections.contact.kicker')}
          </p>
          <h2 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-white">
            {t('sections.contact.title')}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#a9bccd]">{data.person.availability}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#6f879c]">{t('sections.contact.subtitle')}</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={data.links.email}>
            <ShimmerButton background="linear-gradient(135deg,#0b2a2a,#0a1a2c)" shimmerColor="#2ee6c5" className="px-7 py-4 text-base">
              <span className="flex items-center gap-2.5">
                <Mail className="size-4" />
                <span dir="ltr">{data.person.email}</span>
              </span>
            </ShimmerButton>
          </a>
          <CopyButton
            value={data.person.email}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-4 text-sm text-white transition hover:bg-white/[0.06]"
            copiedLabel={
              <span className="inline-flex items-center gap-2 text-[#2ee6c5]">
                <Check className="size-4" /> {t('common.copied')}
              </span>
            }
          >
            <span className="inline-flex items-center gap-2">
              <Copy className="size-4" /> {t('common.copyEmail')}
            </span>
          </CopyButton>
        </Reveal>

        <Reveal delay={0.2} className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.href!}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[#070c17]/70 px-4 py-3.5 text-sm text-[#cfe3f2] backdrop-blur transition hover:border-[#2ee6c5]/40 hover:text-white"
            >
              <span className="flex items-center gap-2.5 whitespace-nowrap">
                <BrandIcon name={l.id} className="size-4 shrink-0" />
                {l.label}
              </span>
              <ArrowUpRight className="flip-rtl size-3.5 opacity-50 transition group-hover:opacity-100" />
            </a>
          ))}
        </Reveal>
        <p className="mt-8 inline-flex items-center gap-2 text-sm text-[#6f879c]">
          <MapPin className="size-4" /> {data.person.location}
        </p>
      </div>

      <footer className="absolute inset-x-0 bottom-0 border-t border-white/[0.06] bg-[#04060c]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-[#5d7186] sm:flex-row sm:px-10">
          <span className="flex items-center gap-2">
            <HelixMark className="size-5" /> {t('common.rights', { year: fmtYear(data.locale, new Date(data.generatedAt).getFullYear()) })}
          </span>
          <span className="text-center">{t('common.builtWith')}</span>
        </div>
      </footer>
    </section>
  );
}
