export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-sm font-display">AI</span>
      </div>
      <div className="leading-tight">
        <p className="font-display text-[15px] font-semibold text-brand-800">Afrika Influence</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brass-600 -mt-0.5">Hub</p>
      </div>
    </div>
  );
}
