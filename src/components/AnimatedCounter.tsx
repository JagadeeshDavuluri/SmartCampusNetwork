'use client'

import { useState, useEffect, useRef } from 'react'

interface AnimatedCounterProps {
    value: number
    duration?: number
    className?: string
    prefix?: string
    suffix?: string
}

export function AnimatedCounter({ value, duration = 1200, className = '', prefix = '', suffix = '' }: AnimatedCounterProps) {
    const [displayed, setDisplayed] = useState(0)
    const prevValue = useRef(0)
    const frameRef = useRef<number>(0)

    useEffect(() => {
        const start = prevValue.current
        const end = value
        const startTime = performance.now()

        const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = Math.round(start + (end - start) * eased)
            setDisplayed(current)

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate)
            } else {
                prevValue.current = end
            }
        }

        frameRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frameRef.current)
    }, [value, duration])

    return (
        <span className={className}>
            {prefix}{displayed.toLocaleString()}{suffix}
        </span>
    )
}
