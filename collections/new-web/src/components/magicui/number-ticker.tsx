"use client"

import { useEffect, useMemo, useRef, type ComponentPropsWithoutRef } from "react"
import { useInView, useMotionValue, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
  /** BCP-47 locale for digits/grouping (e.g. "fa-IR" renders Persian digits). */
  locale?: string
  /** count up even when the number is already visible when it mounts (e.g. a slide that just appeared) */
  animateOnMount?: boolean
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  locale = "en-US",
  animateOnMount = false,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })
  // one formatter per ticker (not one per animation frame)
  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }),
    [locale, decimalPlaces]
  )
  const fmt = (n: number) => nf.format(n)
  // The server (and no-JS / reduced-motion visitors) see the real number. On mount the counter is
  // armed — reset to the start value — only if it will count up visibly: motion allowed and either
  // still off-screen or explicitly asked to animate on mount. Otherwise it simply stays final.
  const armed = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const r = el.getBoundingClientRect()
    const visible = r.bottom > 0 && r.top < window.innerHeight
    if (!visible || animateOnMount) {
      armed.current = true
      el.textContent = fmt(direction === "down" ? value : startValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    if (isInView && armed.current) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value)
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [motionValue, isInView, delay, value, direction, startValue])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current && armed.current) {
          // write only when the shown digits change: the spring's long tail would otherwise
          // replace the same text every frame and keep the page repainting for seconds
          const text = fmt(Number(latest.toFixed(decimalPlaces)))
          if (ref.current.textContent !== text) ref.current.textContent = text
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [springValue, nf, decimalPlaces]
  )

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-wider text-black tabular-nums dark:text-white",
        className
      )}
      {...props}
    >
      {fmt(direction === "down" ? startValue : value)}
    </span>
  )
}
