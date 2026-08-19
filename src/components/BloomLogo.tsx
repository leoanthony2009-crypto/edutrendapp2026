import { useId } from 'react'

/** The six-petal Poui blossom — gold gradient petals at 60° steps around a green
    center (README § Brand mark). */
export function BloomLogo({ size = 28, className, animate = false }: { size?: number; className?: string; animate?: boolean }) {
  const gradientId = useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Bloom"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9B93B" />
          <stop offset="1" stopColor="#C8A951" />
        </linearGradient>
      </defs>
      <g transform="translate(32 32)">
        {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
          <ellipse
            key={rotation}
            cx="0"
            cy="-14"
            rx="7.5"
            ry="14"
            fill={`url(#${gradientId})`}
            transform={`rotate(${rotation})`}
            style={
              animate
                ? {
                    animation: `petal .65s cubic-bezier(.2,.9,.3,1.2) ${i * 0.11}s both`,
                    transformOrigin: 'center',
                    transformBox: 'view-box',
                  }
                : undefined
            }
          />
        ))}
        <circle
          r="7.5"
          fill="#295C4D"
          style={
            animate
              ? { animation: 'petal .45s ease .7s both', transformOrigin: 'center', transformBox: 'view-box' }
              : undefined
          }
        />
      </g>
    </svg>
  )
}
