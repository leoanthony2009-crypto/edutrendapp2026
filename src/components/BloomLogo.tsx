// Six-petal Poui blossom mark — proper SVG per README (replaces the
// prototype's conic-gradient stand-in). Gold gradient petals at 60° steps
// around a bloom-green centre.
export function BloomLogo({ size = 28, className }: { size?: number; className?: string }) {
  const id = `bp-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Bloom"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9B93B" />
          <stop offset="1" stopColor="#C8A951" />
        </linearGradient>
      </defs>
      <g transform="translate(50 50)">
        {[0, 60, 120, 180, 240, 300].map((rot) => (
          <path
            key={rot}
            d="M0-40C8-40 12.5-27 12.5-14.5C12.5-4 6.5 2 0 2C-6.5 2-12.5-4-12.5-14.5C-12.5-27-8-40 0-40Z"
            fill={`url(#${id})`}
            transform={`rotate(${rot})`}
          />
        ))}
        <circle r="13" fill="#295C4D" />
      </g>
    </svg>
  );
}

/** Animated bloom used by the splash and the pulse done state. */
export function BloomAnimated({ size = 120 }: { size?: number }) {
  const petalW = size * 0.25;
  const petalH = size * 0.48;
  return (
    <div
      className="relative animate-breathe"
      style={{ width: size, height: size, animationDelay: "1.2s" }}
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 60}deg)` }}>
          <div
            className="absolute left-1/2"
            style={{
              top: size * 0.017,
              width: petalW,
              height: petalH,
              marginLeft: -petalW / 2,
              borderRadius: "50% 50% 46% 46%/62% 62% 38% 38%",
              background: "linear-gradient(#E9B93B,#C8A951)",
              transformOrigin: "50% 100%",
              animation: `petal .65s cubic-bezier(.2,.9,.3,1.2) ${i * 0.1}s both`,
            }}
          />
        </div>
      ))}
      <div
        className="absolute left-1/2 top-1/2 rounded-full bg-green"
        style={{
          width: size * 0.2,
          height: size * 0.2,
          margin: `${-size * 0.1}px 0 0 ${-size * 0.1}px`,
          animation: "petal .45s ease .62s both",
        }}
      />
    </div>
  );
}
