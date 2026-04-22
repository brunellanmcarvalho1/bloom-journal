import { useEffect, useMemo, useState } from "react";
import { Flower2, Trash2, X } from "lucide-react";

import { FlowerCalendar } from "../components/FlowerCalendar.jsx";
import { api } from "../lib/api.js";

function monthKeyFromDate(value) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

function tokenizeText(value) {
  return value.split(/(\s+)/).filter(Boolean);
}

function buildCorrectedDiff(originalText = "", correctedText = "") {
  const originalTokens = tokenizeText(originalText);
  const correctedTokens = tokenizeText(correctedText);

  const rows = originalTokens.length;
  const cols = correctedTokens.length;
  const lcs = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));

  for (let row = rows - 1; row >= 0; row -= 1) {
    for (let col = cols - 1; col >= 0; col -= 1) {
      if (originalTokens[row] === correctedTokens[col]) {
        lcs[row][col] = lcs[row + 1][col + 1] + 1;
      } else {
        lcs[row][col] = Math.max(lcs[row + 1][col], lcs[row][col + 1]);
      }
    }
  }

  const highlighted = [];
  let row = 0;
  let col = 0;

  while (row < rows && col < cols) {
    if (originalTokens[row] === correctedTokens[col]) {
      highlighted.push({ value: correctedTokens[col], changed: false });
      row += 1;
      col += 1;
    } else if (lcs[row + 1][col] >= lcs[row][col + 1]) {
      row += 1;
    } else {
      highlighted.push({
        value: correctedTokens[col],
        changed: !/\s+/.test(correctedTokens[col]),
      });
      col += 1;
    }
  }

  while (col < cols) {
    highlighted.push({
      value: correctedTokens[col],
      changed: !/\s+/.test(correctedTokens[col]),
    });
    col += 1;
  }

  return highlighted;
}

function CalendarPage() {
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [entriesById, setEntriesById] = useState({});
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [selectedEntryType, setSelectedEntryType] = useState("diary");
  const [activeMonthKey, setActiveMonthKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/api/diary/calendar"), api.get("/api/diary/entries")])
      .then(([calendarResponse, entriesResponse]) => {
        const entries = entriesResponse.data.entries;
        const mappedById = Object.fromEntries(entries.map((entry) => [entry._id, entry]));

        setCalendarEntries(calendarResponse.data.calendar);
        setEntriesById(mappedById);
        if (calendarResponse.data.calendar.length) {
          const firstDay = calendarResponse.data.calendar[0];
          setActiveMonthKey(monthKeyFromDate(firstDay.date));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const selectedDay = useMemo(
    () => (selectedDayId ? calendarEntries.find((entry) => entry.id === selectedDayId) : null),
    [calendarEntries, selectedDayId],
  );

  const selectedEntry = useMemo(() => {
    if (!selectedDay) {
      return null;
    }

    const preferred = selectedDay.entries?.find((entry) => entry.type === selectedEntryType);
    const selectedVariant = preferred || selectedDay.entries?.[0];

    if (!selectedVariant) {
      return null;
    }

    return entriesById[selectedVariant.id] || null;
  }, [entriesById, selectedDay, selectedEntryType]);

  const correctedDiff = useMemo(() => {
    if (!selectedEntry) {
      return [];
    }

    return buildCorrectedDiff(
      selectedEntry.originalText || "",
      selectedEntry.correctedText || "",
    );
  }, [selectedEntry]);

  useEffect(() => {
    if (selectedEntry) {
      setActiveMonthKey(monthKeyFromDate(selectedEntry.entryDate));
    }
  }, [selectedEntry]);

  useEffect(() => {
    if (selectedDay?.entries?.length) {
      const hasSelectedType = selectedDay.entries.some(
        (entry) => entry.type === selectedEntryType,
      );

      if (!hasSelectedType) {
        setSelectedEntryType(selectedDay.entries[0].type);
      }
    }
  }, [selectedDay, selectedEntryType]);

  async function handleDeleteEntry() {
    if (!selectedEntry || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      "Do you want to delete this diary entry? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await api.delete(`/api/diary/entries/${selectedEntry._id}`);

      setEntriesById((current) => {
        const next = { ...current };
        delete next[selectedEntry._id];
        return next;
      });

      setCalendarEntries((current) => {
        const nextDays = current
          .map((day) => {
            if (day.id !== selectedDayId) {
              return day;
            }

            const remainingEntries = (day.entries || []).filter(
              (entry) => entry.id !== selectedEntry._id,
            );

            if (!remainingEntries.length) {
              return null;
            }

            const typeSet = new Set(remainingEntries.map((entry) => entry.type));

            return {
              ...day,
              entries: remainingEntries,
              band:
                remainingEntries.reduce((sum, entry) => sum + (entry.band || 0), 0) /
                remainingEntries.length,
              variant: typeSet.size > 1 ? "both" : remainingEntries[0].type,
            };
          })
          .filter(Boolean);

        const selectedDayAfterDelete = nextDays.find((day) => day.id === selectedDayId);

        if (selectedDayAfterDelete?.entries?.length) {
          setSelectedEntryType(selectedDayAfterDelete.entries[0].type);
        } else {
          setSelectedDayId(nextDays[0]?.id || null);
          setSelectedEntryType(nextDays[0]?.entries?.[0]?.type || "diary");
        }

        return nextDays;
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="grid gap-4">
        <section className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-rose-700">
            Flower calendar
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl text-plum-900">
            A bloom for every day you wrote.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
            Click any flower to revisit the original text, corrected version, and
            all the feedback from that day.
          </p>

          <div className="mt-6">
            {isLoading ? (
              <div className="rounded-[1.8rem] bg-white/70 px-6 py-10 text-center text-ink-700">
                Loading your flowers...
              </div>
            ) : calendarEntries.length ? (
              <FlowerCalendar
                activeMonthKey={activeMonthKey}
                entries={calendarEntries}
                selectedDayId={selectedDayId}
                onMonthChange={setActiveMonthKey}
                onSelect={setSelectedDayId}
              />
            ) : (
              <div className="rounded-[1.8rem] bg-blush-50 px-6 py-10 text-center text-ink-700">
                No flowers yet. Save your first diary entry and your calendar will
                start blooming.
              </div>
            )}
          </div>
        </section>

        <section className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-700">
            How to use
          </p>
          <h3 className="mt-2 font-display text-4xl text-plum-900">
            Tap a flower day
          </h3>
          <div className="mt-6 rounded-[1.6rem] bg-linear-to-br from-blush-100 via-peach-100 to-lilac-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-rose-500">
                <Flower2 size={20} />
              </div>
              <p className="text-sm leading-6 text-ink-700">
                Use the arrows to move between months. Click any flower day to
                open the full entry, corrected text, and suggestions in a
                focused modal. Colors show whether that day was Diary, Challenge,
                or both.
              </p>
            </div>
          </div>
        </section>
      </div>

      {selectedEntry && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/25 p-4 backdrop-blur-sm">
          <div className="glass-panel relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/75 p-6 md:p-8">
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteEntry}
                disabled={isDeleting}
                className="rounded-full border border-rose-200 bg-white/85 p-2 text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Delete entry"
                title="Delete entry"
              >
                <Trash2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayId(null)}
                className="rounded-full border border-white/70 bg-white/80 p-2 text-rose-700 transition hover:bg-blush-50"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-700/75">
              Selected day
            </p>
            <h3 className="mt-2 font-display text-4xl text-plum-900">
              Entry details
            </h3>

            <div className="mt-6 space-y-4">
              <div className="rounded-[1.5rem] bg-linear-to-br from-blush-100 via-peach-100 to-lilac-100 p-5">
                <p className="text-sm font-bold text-plum-900">
                  {new Date(selectedEntry.entryDate).toLocaleDateString("en-US")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                    {selectedEntry.entryType || "diary"}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-rose-700">
                    Band {selectedEntry.ielts?.estimatedBand || "-"}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-rose-700">
                    {selectedEntry.wordCount} words
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-rose-700">
                    {isDeleting ? "Deleting..." : "Entry saved"}
                  </span>
                </div>
                {selectedDay.entries?.length > 1 ? (
                  <div className="mt-4 inline-flex rounded-full bg-white/70 p-1">
                    {selectedDay.entries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedEntryType(entry.type)}
                        className={[
                          "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition",
                          selectedEntryType === entry.type
                            ? "bg-white text-rose-700 shadow-sm"
                            : "text-ink-700",
                        ].join(" ")}
                      >
                        {entry.type === "challenge" ? "Challenge" : "Diary"}
                      </button>
                    ))}
                  </div>
                ) : null}
                {selectedEntry.entryType === "challenge" && selectedEntry.challengePrompt ? (
                  <p className="mt-4 rounded-2xl bg-white/75 px-4 py-3 text-sm leading-6 text-ink-700">
                    <span className="font-bold text-plum-900">Prompt:</span> {selectedEntry.challengePrompt}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white/70 p-4">
                  <p className="text-sm font-bold text-plum-900">Original text</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-700">
                    {selectedEntry.originalText}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/70 p-4">
                  <p className="text-sm font-bold text-plum-900">Corrected text</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-700">
                    {correctedDiff.map((token, index) =>
                      token.changed ? (
                        <span key={`${token.value}-${index}`} className="corrected-highlight">
                          {token.value}
                        </span>
                      ) : (
                        <span key={`${token.value}-${index}`}>{token.value}</span>
                      ),
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-white/70 p-4">
                <p className="text-sm font-bold text-plum-900">Suggestions</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-700">
                  {selectedEntry.suggestions?.map((item) => (
                    <li key={item} className="rounded-xl bg-blush-50 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { CalendarPage };
