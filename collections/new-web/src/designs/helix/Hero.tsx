'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import DecryptedText from '@/components/reactbits/DecryptedText';
import RotatingText from '@/components/reactbits/RotatingText';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { BrandIcon } from '@/components/shared/BrandIcon';
import type { SiteData } from '@/lib/types';
import { BASE_COLORS } from './ui';

const DnaHelix = dynamic(() => import('./DnaHelix'), { ssr: false });

export function Hero({ data }: { data: SiteData }) {
  const t = useTranslations('helix');
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [inView, setInView] = useState(true);
  const [compact, setCompact] = useState(false);
  // reduced motion is only known on the client: apply it after mount so hydration matches the server HTML
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const still = mounted && reduce;
  const fa = data.locale === 'fa';
  const now = data.current[0];

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener('change', update);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '0px' });
    if (ref.current) io.observe(ref.current);
    return () => {
      mq.removeEventListener('change', update);
      io.disconnect();
    };
  }, []);

  const socials = [
    { id: 'github', href: data.links.github },
    { id: 'linkedin', href: data.links.linkedin },
    { id: 'orcid', href: data.links.orcid },
    { id: 'scholar', href: data.links.scholar },
  ].filter((s) => s.href);

  return (
    <section id="top" ref={ref} className="relative isolate min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_80%_60%_at_75%_35%,rgba(46,230,197,0.14),transparent_60%),radial-gradient(ellipse_60%_50%_at_10%_90%,rgba(76,201,240,0.12),transparent_60%),radial-gradient(ellipse_40%_40%_at_90%_90%,rgba(255,181,71,0.08),transparent_60%)]" />
      <div className="hx-grid absolute inset-0 -z-20 opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
      <div className={compact ? 'absolute inset-0 -z-10 opacity-45' : 'absolute inset-0 -z-10'}>
        <DnaHelix active={inView} reduced={reduce} compact={compact} side={data.dir === 'rtl' ? 'left' : 'right'} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#04060c] via-[#04060c]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#04060c] to-transparent" />

      <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-6 pb-24 pt-32 sm:px-10">
        <div className="max-w-[44rem]">
          {now && (
            <motion.a
              href="#experience"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
              className="mb-8 inline-flex max-w-full items-center gap-2.5 rounded-full border border-[#2ee6c5]/25 bg-[#2ee6c5]/[0.06] py-1.5 pe-4 ps-2 text-[13px] text-[#c9fff4] backdrop-blur"
            >
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2ee6c5] opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[#2ee6c5]" />
              </span>
              <span className="truncate">
                <span className="font-medium">{t('currently')}:</span> {now.org}
              </span>
            </motion.a>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.8 }}
            className="mb-5 font-mono text-xs uppercase tracking-[0.3em] text-[#7f97ad]"
          >
            {data.person.headline}
          </motion.p>

          <h1 className="font-display text-[clamp(3.2rem,9vw,7.6rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-white">
            {fa ? (
              <span className="flex flex-wrap gap-x-[0.25em]">
                {data.person.displayName.split(' ').map((w, i) => (
                  <motion.span
                    key={w}
                    initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.3 + i * 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="hx-gradient-text"
                  >
                    {w}
                  </motion.span>
                ))}
              </span>
            ) : (
              <DecryptedText
                text={data.person.fullName}
                animateOn="view"
                sequential
                revealDirection="start"
                speed={42}
                characters="ACGTACGTUatgc"
                parentClassName="hx-gradient-text"
                encryptedClassName="text-[#2ee6c5]/70"
              />
            )}
          </h1>
          {fa && (
            <p className="mt-3 font-display text-lg tracking-wide text-[#7f97ad]">
              <span lang="en" dir="ltr">{data.person.fullName}</span>
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3 font-display text-2xl text-[#cfe3f2] sm:text-3xl">
            <span className="text-[#2ee6c5] rtl:-scale-x-100" aria-hidden>
              ▸
            </span>
            {still ? (
              // reduced motion: no rotation — all labels at once
              <ul className="flex flex-wrap gap-2">
                {data.person.labels.map((l) => (
                  <li key={l} className="rounded-xl bg-white/[0.06] px-3 py-0.5 text-white ring-1 ring-white/10">
                    {l}
                  </li>
                ))}
              </ul>
            ) : (
              <RotatingText
                texts={data.person.labels}
                splitBy={fa ? 'words' : 'characters'}
                rotationInterval={2600}
                animatePresenceMode="popLayout"
                pauseOnHover
                staggerDuration={0.018}
                staggerFrom="first"
                mainClassName="overflow-hidden rounded-xl bg-white/[0.06] px-3 py-0.5 ring-1 ring-white/10"
                elementLevelClassName="text-white"
              />
            )}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-[#9fb3c8]"
          >
            {data.person.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a href="#projects">
              <ShimmerButton background="linear-gradient(135deg,#0b2a2a,#0a1a2c)" shimmerColor="#2ee6c5" className="px-6 py-3.5 text-sm font-medium">
                <span className="flex items-center gap-2">
                  {t('ctaProjects')}
                  <ArrowDown className="size-4" />
                </span>
              </ShimmerButton>
            </a>
            <a href="#contact" className="group inline-flex items-center gap-1.5 rounded-full px-5 py-3.5 text-sm text-white ring-1 ring-white/15 transition hover:bg-white/[0.06]">
              {t('ctaContact')}
              <ArrowUpRight className="flip-rtl size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <div className="flex items-center gap-1 ps-1">
              {socials.map((s) => (
                <a key={s.id} href={s.href!} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full text-[#9fb3c8] transition hover:bg-white/[0.06] hover:text-white">
                  <BrandIcon name={s.id} className="size-[18px]" />
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-14 flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.25em] text-[#6b8399]"
          >
            <span className="flex items-center gap-3">
              <span className="relative h-9 w-5 rounded-full border border-white/20">
                <span className="absolute start-1/2 top-1.5 h-2 w-0.5 -translate-x-1/2 animate-bounce rounded-full bg-[#2ee6c5] rtl:translate-x-1/2" />
              </span>
              <span className="hidden sm:inline">{t('scroll')}</span>
            </span>
            <span className="hidden items-center gap-3 normal-case tracking-normal sm:flex" lang="en" dir="ltr">
              {(['A', 'T', 'G', 'C'] as const).map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: BASE_COLORS[b], boxShadow: `0 0 12px ${BASE_COLORS[b]}` }} />
                  {b}
                </span>
              ))}
            </span>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
