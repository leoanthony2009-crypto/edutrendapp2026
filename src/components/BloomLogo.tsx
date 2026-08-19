import { useId } from 'react'

/** The six-petal Poui blossom mark — gold gradient petals around a green center. */
export function BloomLogo({ size = 28, title = 'Bloom' }: { size?: number; title?: string }) {
  // Unique per instance: a shared gradient id breaks when the first instance
  // sits in a display:none subtree (e.g. the hidden desktop rail on mobile).
  const gradientId = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9B93B" />
          <stop offset="1" stopColor="#C8A951" />
        </linearGradient>
      </defs>
      <g transform="translate(32 32)">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <path
            key={deg}
            d="M0 -28 C 8 -23 8 -8 0 -3 C -8 -8 -8 -23 0 -28 Z"
            fill={`url(#${gradientId})`}
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="7.5" fill="#295C4D" />
      </g>
    </svg>
  )
}

/** Animated variant used by the splash and pulse-done states. */
export function BloomMarkAnimated({ size = 120 }: { size?: number }) {
  const petalW = size * 0.25
  const petalH = size * 0.48
  return (
    <div className="animate-breathe relative" style={{ width: size, height: size }} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 60}deg)` }}>
          <div
            className="animate-petal absolute left-1/2 origin-bottom rounded-[50%_50%_46%_46%/62%_62%_38%_38%] bg-linear-to-b from-bloom-gold-bright to-bloom-gold"
            style={{
              top: size * 0.017,
              width: petalW,
              height: petalH,
              marginLeft: -petalW / 2,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        </div>
      ))}
      <div
        className="animate-petal absolute top-1/2 left-1/2 rounded-full bg-bloom-green"
        style={{
          width: size * 0.2,
          height: size * 0.2,
          margin: `${-size * 0.1}px 0 0 ${-size * 0.1}px`,
          animationDelay: '0.62s',
        }}
      />
    </div>
  )
}
