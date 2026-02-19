import { useEffect, useState } from 'react'

const BUBBLES = [
  { id: 0, x: 5,  size: 12, dur: 7,  delay: 0   },
  { id: 1, x: 15, size: 8,  dur: 9,  delay: 1.5 },
  { id: 2, x: 26, size: 20, dur: 6,  delay: 0.5 },
  { id: 3, x: 38, size: 10, dur: 8,  delay: 2   },
  { id: 4, x: 50, size: 16, dur: 5,  delay: 1   },
  { id: 5, x: 62, size: 24, dur: 10, delay: 0.2 },
  { id: 6, x: 73, size: 9,  dur: 7,  delay: 2.5 },
  { id: 7, x: 82, size: 14, dur: 6,  delay: 1.8 },
  { id: 8, x: 90, size: 19, dur: 8,  delay: 0.7 },
  { id: 9, x: 96, size: 11, dur: 9,  delay: 3   },
]

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 2700)
    const doneTimer = setTimeout(() => onFinish(), 3350)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onFinish])

  return (
    <div className={`splash-root${exiting ? ' splash-exit' : ''}`}>

      {/* Bubbles */}
      {BUBBLES.map(b => (
        <span
          key={b.id}
          className="splash-bubble"
          style={{
            left: `${b.x}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      {/* Central content */}
      <div className="splash-content">

        {/* Logo + pulse rings */}
        <div className="splash-logo-wrap">
          <span className="splash-ring splash-ring-1" />
          <span className="splash-ring splash-ring-2" />
          <img
            src="/logo.png"
            alt="DeisyRestaurant"
            width={120}
            height={120}
            className="splash-logo"
          />
        </div>

        {/* Brand name */}
        <div className="splash-brand">
          <span className="splash-brand-deisy">Deisy</span>
          <span className="splash-brand-rest">Restaurant</span>
        </div>

        {/* Tagline */}
        <p className="splash-tagline">· Sistema de Ventas ·</p>

        {/* Loading bar */}
        <div className="splash-track">
          <div className="splash-bar" />
        </div>

      </div>

      {/* Waves */}
      <div className="splash-waves" aria-hidden="true">
        <div className="splash-wave-inner">
          {[0, 1].map(n => (
            <svg
              key={n}
              viewBox="0 0 600 80"
              preserveAspectRatio="none"
              style={{ width: '50%', height: '100%', flexShrink: 0 }}
            >
              <path
                d="M0,45 C80,15 200,72 300,45 C400,18 520,65 600,45 L600,80 L0,80 Z"
                fill="rgba(255,255,255,0.07)"
              />
              <path
                d="M0,60 C120,38 240,74 380,56 C480,42 560,68 600,60 L600,80 L0,80 Z"
                fill="rgba(255,255,255,0.04)"
              />
            </svg>
          ))}
        </div>
      </div>

    </div>
  )
}
