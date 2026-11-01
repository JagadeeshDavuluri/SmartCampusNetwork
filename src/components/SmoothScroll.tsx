'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * One Lenis instance for the whole app, driven by the GSAP ticker so
 * ScrollTrigger and smooth scroll never fight over the scroll position.
 * Skipped entirely when the user prefers reduced motion (native scroll).
 */
export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      smoothWheel: true,
      // Keep native scrolling inside dialogs, selects, ScrollAreas, etc.
      prevent: (node) =>
        !!node.closest(
          '[role="dialog"], [role="listbox"], [data-radix-scroll-area-viewport], [data-radix-popper-content-wrapper], [data-lenis-prevent]'
        ),
    })

    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return null
}
