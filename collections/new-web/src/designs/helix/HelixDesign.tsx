'use client';

import { SmoothScroll } from '@/components/shared/SmoothScroll';
import type { SiteData } from '@/lib/types';
import { About, SequenceStrip } from './About';
import { Contact } from './Contact';
import { Education } from './Education';
import { Experience } from './Experience';
import { Hero } from './Hero';
import { Nav } from './Nav';
import { Projects } from './Projects';
import { Publications } from './Publications';
import { Skills } from './Skills';
import './helix.css';

/** Design 1 — Helix: cinematic dark 3D, a real-time DNA double helix and bioluminescent UI. */
export default function HelixDesign({ data }: { data: SiteData }) {
  return (
    <div className="helix min-h-dvh overflow-x-clip">
      <SmoothScroll />
      <Nav data={data} />
      <main id="main">
        <Hero data={data} />
        <SequenceStrip />
        <About data={data} />
        <Experience data={data} />
        <SequenceStrip reverse />
        <Projects data={data} />
        <Skills data={data} />
        <Publications data={data} />
        <Education data={data} />
        <Contact data={data} />
      </main>
      <div className="h-20" aria-hidden />
    </div>
  );
}
