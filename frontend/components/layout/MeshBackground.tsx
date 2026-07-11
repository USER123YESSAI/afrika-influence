export function MeshBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="meshLine" x1="0" y1="0" x2="800" y2="600" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" stopOpacity="0.5" />
          <stop offset="1" stopColor="#34D399" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {[
        [80, 90, 260, 180], [260, 180, 470, 60], [470, 60, 700, 150],
        [80, 90, 210, 320], [210, 320, 470, 60], [210, 320, 430, 420],
        [430, 420, 700, 150], [430, 420, 620, 500], [700, 150, 620, 500],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#meshLine)" strokeWidth="1" />
      ))}
      {[[80,90],[260,180],[470,60],[700,150],[210,320],[430,420],[620,500]].map(([cx,cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 3 : 2} fill="#22D3EE" opacity="0.7" />
      ))}
    </svg>
  );
}