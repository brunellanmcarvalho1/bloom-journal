function StatCard({ label, value, help, accent = "from-blush-100 to-peach-100" }) {
  return (
    <article className={`rounded-[1.75rem] bg-linear-to-br ${accent} p-[1px]`}>
      <div className="h-full rounded-[calc(1.75rem-1px)] bg-white/85 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-rose-700/70">
          {label}
        </p>
        <p className="mt-3 font-display text-5xl leading-none text-plum-900">
          {value}
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-700">{help}</p>
      </div>
    </article>
  );
}

export { StatCard };
