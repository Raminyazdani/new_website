'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';

/** Fade/slide content in once when it scrolls into view. Honors prefers-reduced-motion. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  x = 0,
  blur = false,
  once = true,
  amount = 0.25,
  ...rest
}: HTMLMotionProps<'div'> & { delay?: number; y?: number; x?: number; blur?: boolean; once?: boolean; amount?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      // the server cannot know the motion preference and renders the hidden start state; the client must render the
      // same start state (a different `initial` for reduced motion would be a hydration mismatch). data-reveal lets CSS
      // show it at once for reduced motion (globals.css) and without JavaScript (<noscript> style in the layout)
      data-reveal=""
      initial={{ opacity: 0, y, x, filter: blur ? 'blur(10px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={reduce ? { duration: 0 } : { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
