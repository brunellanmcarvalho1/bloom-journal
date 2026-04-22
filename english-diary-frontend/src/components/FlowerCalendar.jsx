import { ChevronLeft, ChevronRight } from "lucide-react";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const flowerVariantClasses = {
  diary: "flower-petal-diary",
  challenge: "flower-petal-challenge",
  both: "flower-petal-both",
};

function FlowerIcon({ variant, className = "h-8 w-8" }) {
  const variantClass = flowerVariantClasses[variant];

  return (
    <div className={`flower-mark ${className}`}>
      <span className={`flower-petal ${variantClass} flower-petal-top`} />
      <span className={`flower-petal ${variantClass} flower-petal-right`} />
      <span className={`flower-petal ${variantClass} flower-petal-bottom-right`} />
      <span className={`flower-petal ${variantClass} flower-petal-bottom-left`} />
      <span className={`flower-petal ${variantClass} flower-petal-left`} />
    </div>
  );
}

function buildCalendarGrid(year, month, monthEntries) {
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
  const daysInMonth = lastDayOfMonth.getUTCDate();
  const startOffset = firstDayOfMonth.getUTCDay();
  const entriesByDay = new Map(
    monthEntries.map((entry) => [new Date(entry.date).getUTCDate(), entry]),
  );

  const cells = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({ type: "empty", key: `empty-start-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      type: "day",
      key: `day-${year}-${month}-${day}`,
      day,
      entry: entriesByDay.get(day) || null,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ type: "empty", key: `empty-end-${cells.length}` });
  }

  return cells;
}

function buildMonthOptions(entries) {
  if (!entries.length) {
    const today = new Date();
    return [
      {
        key: `${today.getUTCFullYear()}-${today.getUTCMonth()}`,
        year: today.getUTCFullYear(),
        month: today.getUTCMonth(),
      },
    ];
  }

  const monthMap = new Map();

  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const key = `${year}-${month}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, { key, year, month });
    }
  });

  return Array.from(monthMap.values()).sort(
    (left, right) =>
      Date.UTC(left.year, left.month, 1) - Date.UTC(right.year, right.month, 1),
  );
}

function FlowerCalendar({
  entries,
  selectedDayId,
  activeMonthKey,
  onMonthChange,
  onSelect,
}) {
  const grouped = entries.reduce((accumulator, entry) => {
    const date = new Date(entry.date);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(entry);
    return accumulator;
  }, {});

  const monthOptions = buildMonthOptions(entries);
  const currentMonthIndex = monthOptions.findIndex(
    (month) => month.key === activeMonthKey,
  );
  const safeMonthIndex = currentMonthIndex >= 0 ? currentMonthIndex : monthOptions.length - 1;
  const currentMonth = monthOptions[safeMonthIndex];
  const monthEntries = grouped[currentMonth.key] || [];
  const monthName = new Date(
    Date.UTC(currentMonth.year, currentMonth.month, 1),
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <section className="mx-auto max-w-4xl rounded-[1.6rem] bg-[#fffdfd] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onMonthChange(monthOptions[safeMonthIndex - 1]?.key)}
          disabled={safeMonthIndex === 0}
          className="rounded-full border border-[#f1dbe5] bg-white p-3 text-rose-700 shadow-[0_10px_26px_rgba(219,112,151,0.08)] transition hover:bg-blush-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <h3 className="font-display text-3xl text-plum-900">{monthName}</h3>
          <span className="mt-2 inline-block rounded-full bg-blush-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-700">
            {monthEntries.length} blooms
          </span>
        </div>

        <button
          type="button"
          onClick={() => onMonthChange(monthOptions[safeMonthIndex + 1]?.key)}
          disabled={safeMonthIndex === monthOptions.length - 1}
          className="rounded-full border border-[#f1dbe5] bg-white p-3 text-rose-700 shadow-[0_10px_26px_rgba(219,112,151,0.08)] transition hover:bg-blush-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((label) => (
          <div
            key={`${currentMonth.key}-${label}`}
            className="pb-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#8f7486]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {buildCalendarGrid(currentMonth.year, currentMonth.month, monthEntries).map(
          (cell) => {
            if (cell.type === "empty") {
              return (
                <div
                  key={cell.key}
                  className="aspect-square rounded-[1rem] bg-[#f7f2f6]"
                />
              );
            }

            const { day, entry } = cell;
            const isSelected = selectedDayId === entry?.id;
            const isWrittenDay = Boolean(entry);
            const diaryEntry = entry?.entries?.find((item) => item.type === "diary");
            const challengeEntry = entry?.entries?.find((item) => item.type === "challenge");

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => entry && onSelect(entry.id)}
                disabled={!entry}
                className={[
                  "flower-button relative aspect-square border p-1.5 text-left transition",
                  isWrittenDay
                    ? isSelected
                      ? "border-transparent bg-transparent text-plum-900 shadow-none"
                      : "border-transparent bg-transparent text-plum-900 shadow-none"
                    : "cursor-default rounded-[1rem] border border-[#f1dbe5] bg-[#fffafb] text-[#8f7486] shadow-none",
                ].join(" ")}
              >
                {!isWrittenDay ? (
                  <div className="flex h-full flex-col">
                    <div className="text-sm font-bold text-[#8c7284]">{day}</div>

                    <div className="mt-auto flex flex-col items-center justify-center gap-1 pb-1">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#b59aaa]">
                        -
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="text-sm font-bold text-plum-900">{day}</div>

                    <div className="mt-auto flex flex-col items-center justify-center gap-1 pb-1">
                      {entry.variant === "both" ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <FlowerIcon variant="diary" className="h-6 w-6" />
                              <span className="mt-1 text-[9px] font-bold text-rose-700">
                                {diaryEntry?.band?.toFixed?.(1) || diaryEntry?.band}
                              </span>
                            </div>
                            <div className="flex flex-col items-center">
                              <FlowerIcon variant="challenge" className="h-6 w-6" />
                              <span className="mt-1 text-[9px] font-bold text-violet-600">
                                {challengeEntry?.band?.toFixed?.(1) || challengeEntry?.band}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <FlowerIcon variant={entry.variant || "diary"} className="h-8 w-8" />
                          <span
                            className={`text-[10px] font-bold ${
                              entry.variant === "challenge" ? "text-violet-600" : "text-rose-700"
                            }`}
                          >
                            {entry.band?.toFixed?.(1) || entry.band}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          },
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-[1.1rem] bg-blush-50 px-3 py-3">
        {[
          ["Diary", "diary"],
          ["Challenge", "challenge"],
        ].map(([label, variant]) => (
          <div key={variant} className="flex items-center gap-2">
            {variant === "both" ? (
              <div className="flex items-center gap-1">
                <FlowerIcon variant="diary" className="h-4 w-4" />
                <FlowerIcon variant="challenge" className="h-4 w-4" />
              </div>
            ) : (
              <FlowerIcon variant={variant} className="h-5 w-5" />
            )}
            <span className="text-xs font-bold text-ink-700">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export { FlowerCalendar };
