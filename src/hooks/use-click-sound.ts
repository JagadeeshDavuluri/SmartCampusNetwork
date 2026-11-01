'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const KEY = 'sc-sound-muted'

/**
 * Crisp mechanical "keyboard switch" click, synthesised with the Web Audio API
 * (a short band-passed noise tick plus a low triangle thock), so no audio file is needed.
 * The AudioContext is created lazily on the first click, which is a user gesture.
 */
export function useClickSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    try { setMuted(localStorage.getItem(KEY) === '1') } catch { /* storage unavailable */ }
  }, [])

  const click = useCallback(() => {
    if (muted) return
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return
      const ctx = (ctxRef.current ??= new AC())
      if (ctx.state === 'suspended') void ctx.resume()

      const t = ctx.currentTime
      const len = Math.floor(ctx.sampleRate * 0.05)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005))

      const tick = ctx.createBufferSource()
      const band = ctx.createBiquadFilter()
      const tickGain = ctx.createGain()
      tick.buffer = buf
      band.type = 'bandpass'
      band.frequency.value = 2600
      band.Q.value = 0.8
      tickGain.gain.value = 0.55
      tick.connect(band).connect(tickGain).connect(ctx.destination)
      tick.start(t)

      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(200, t)
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.05)
      oscGain.gain.setValueAtTime(0.32, t)
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
      osc.connect(oscGain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.08)
    } catch { /* audio blocked: stay silent */ }
  }, [muted])

  const toggle = useCallback(() => {
    setMuted(m => {
      const next = !m
      try { localStorage.setItem(KEY, next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }, [])

  return { click, muted, toggle }
}
