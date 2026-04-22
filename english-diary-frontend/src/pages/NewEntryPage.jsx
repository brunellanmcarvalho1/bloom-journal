import { CalendarDays } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { api } from "../lib/api.js";

const challengePrompts = [
  "Do you think people are too dependent on technology in daily life?",
  "Should children learn practical life skills at school?",
  "Is working from home better than working in an office?",
  "Do social media platforms do more harm than good?",
  "Should governments spend more money on public transport than roads?",
  "Is it better to live in a big city or in a small town?",
  "Do the benefits of online learning outweigh the disadvantages?",
  "Should university education be free for everyone?",
];

function getChallengePromptForDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  const daysSinceEpoch = Math.floor(date.getTime() / 86_400_000);

  return challengePrompts[daysSinceEpoch % challengePrompts.length];
}

function NewEntryPage() {
  const [entryType, setEntryType] = useState("diary");
  const [text, setText] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [savedEntry, setSavedEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [error, setError] = useState("");
  const dateInputRef = useRef(null);
  const challengePrompt = getChallengePromptForDate(entryDate);

  useEffect(() => {
    document.title = "Write Today | Bloom Journal";
  }, []);

  useEffect(() => {
    api
      .get("/api/diary/entries")
      .then((response) => {
        const latestEntry = response.data.entries?.[0] || null;
        setSavedEntry(latestEntry);
      })
      .finally(() => {
        setIsLoadingLatest(false);
      });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/api/diary/entries", {
        text,
        entryDate,
        entryType,
        challengePrompt: entryType === "challenge" ? challengePrompt : "",
      });

      setSavedEntry(response.data.entry);
      setText("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "We couldn't save your diary entry this time.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenDatePicker() {
    if (typeof dateInputRef.current?.showPicker === "function") {
      dateInputRef.current.showPicker();
      return;
    }

    dateInputRef.current?.focus();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_460px]">
      <section className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-rose-700/75">
          Write today
        </p>
        <h2 className="mt-3 font-display text-5xl text-plum-900 md:text-6xl">
          {entryType === "challenge"
            ? "Practice with a writing challenge."
            : "Tell your day in English."}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
          {entryType === "challenge"
            ? "Respond to a guided prompt, develop your ideas clearly, and get feedback on grammar, vocabulary, and structure."
            : "Write freely first. The app will correct your text, explain the main grammar points, suggest stronger vocabulary for the same context, and help you see what to improve next."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <span className="mb-2 block text-sm font-bold text-ink-700">
              Writing mode
            </span>
            <div className="inline-flex rounded-full bg-blush-100 p-1">
              {[
                ["diary", "Diary"],
                ["challenge", "Challenge"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEntryType(value)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-bold transition",
                    entryType === value
                      ? "bg-white text-rose-700 shadow-sm"
                      : "text-ink-700",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-ink-700">
              Entry date
            </span>
            <div className="relative md:max-w-xs">
              <input
                ref={dateInputRef}
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                className="date-input-clean w-full rounded-[1.4rem] border border-[#f1dbe5] bg-white px-4 py-3 pr-12 text-plum-900 shadow-[0_12px_30px_rgba(219,112,151,0.08)] outline-none transition focus:border-rose-300"
              />
              <button
                type="button"
                onClick={handleOpenDatePicker}
                className="absolute inset-y-0 right-4 flex items-center text-rose-500/90 transition hover:text-rose-700"
                aria-label="Open calendar"
              >
                <CalendarDays size={18} strokeWidth={2.2} />
              </button>
            </div>
          </label>

          {entryType === "challenge" ? (
            <div className="rounded-[1.5rem] bg-linear-to-br from-blush-100 via-peach-100 to-lilac-100 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-700/80">
                Today&apos;s challenge
              </p>
              <p className="mt-2 max-w-2xl text-base leading-7 text-plum-900">
                {challengePrompt}
              </p>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-ink-700">
              {entryType === "challenge" ? "Your response" : "Your diary entry"}
            </span>
            <textarea
              required
              rows="14"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="w-full rounded-[1.8rem] border border-white/80 bg-white/80 px-5 py-4 leading-7 outline-none transition placeholder:text-ink-500 focus:border-rose-300"
              placeholder={
                entryType === "challenge"
                  ? "Write your opinion, explain your reasons, and support your ideas with examples..."
                  : "Today I woke up feeling a little tired, but I still wanted to practice my English..."
              }
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-700">
              Words written: <span className="font-bold text-plum-900">{text.trim() ? text.trim().split(/\s+/).length : 0}</span>
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Analyzing and saving..."
                : entryType === "challenge"
                  ? "Save challenge"
                  : "Save diary entry"}
            </button>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}
        </form>
      </section>

      <aside className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-700/75">
          Feedback panel
        </p>
        <h3 className="mt-2 font-display text-4xl text-plum-900">
          Your latest result
        </h3>

        {savedEntry ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] bg-linear-to-br from-blush-100 via-peach-100 to-lilac-100 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-700/80">
                  Estimated band
                </p>
                <p className="mt-2 font-display text-6xl leading-none text-plum-900">
                  {savedEntry.ielts?.estimatedBand || "-"}
                </p>
              </div>
              <div className="mt-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
                {savedEntry.entryType || "diary"}
              </div>
              <p className="mt-3 text-sm text-ink-700">{savedEntry.wordCount} words</p>
              {savedEntry.entryType === "challenge" && savedEntry.challengePrompt ? (
                <p className="mt-4 rounded-2xl bg-white/75 px-4 py-3 text-sm leading-6 text-ink-700">
                  <span className="font-bold text-plum-900">Prompt:</span> {savedEntry.challengePrompt}
                </p>
              ) : null}
              {savedEntry.ielts?.summary ? (
                <p className="mt-4 rounded-2xl bg-white/75 px-4 py-3 text-sm leading-6 text-ink-700">
                  {savedEntry.ielts.summary}
                </p>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] bg-white/70 p-4">
              <p className="text-sm font-bold text-plum-900">Criteria</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  ["Task Response", savedEntry.ielts?.taskResponse],
                  ["Coherence & Cohesion", savedEntry.ielts?.coherenceAndCohesion],
                  ["Lexical Resource", savedEntry.ielts?.lexicalResource],
                  [
                    "Grammar Range & Accuracy",
                    savedEntry.ielts?.grammaticalRangeAndAccuracy,
                  ],
                ].map(([label, item]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-linear-to-br from-white via-blush-50/72 to-blush-100/48 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
                        {label}
                      </p>
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-rose-700">
                        {item?.band || "-"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-700">
                      {item?.feedback || "This criterion will appear after analysis."}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/70 p-4">
              <p className="text-sm font-bold text-plum-900">Grammar ideas</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-700">
                {savedEntry.grammarFeedback?.map((item) => (
                  <li key={item} className="rounded-xl bg-blush-50 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.5rem] bg-white/70 p-4">
              <p className="text-sm font-bold text-plum-900">Better vocabulary for this context</p>
              {savedEntry.vocabularyUpgrades?.length ? (
                <div className="mt-3 space-y-2">
                  {savedEntry.vocabularyUpgrades.map((item) => (
                    <div key={`${item.original}-${item.improved}`} className="rounded-xl bg-blush-50 px-3 py-3">
                      <p className="text-sm font-bold text-plum-900">
                        {item.original} <span className="text-rose-700">→</span> {item.improved}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ink-700">{item.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  Vocabulary upgrades will appear here when the app spots a more
                  natural or precise option for your sentence.
                </p>
              )}
            </div>

            <div className="rounded-[1.5rem] bg-white/70 p-4">
              <p className="text-sm font-bold text-plum-900">Next study focus</p>
              {savedEntry.studyFocus?.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-700">
                  {savedEntry.studyFocus.map((item) => (
                    <li key={item} className="rounded-xl bg-blush-50 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  Your next practice priorities will appear here after analysis.
                </p>
              )}
            </div>
          </div>
        ) : isLoadingLatest ? (
          <div className="mt-6 rounded-[1.6rem] bg-blush-50 p-5 text-sm leading-7 text-ink-700">
            Loading your latest feedback...
          </div>
        ) : (
          <div className="mt-6 rounded-[1.6rem] bg-blush-50 p-5 text-sm leading-7 text-ink-700">
            After you save an entry, you will see the corrected text, feedback,
            vocabulary upgrades, and your next grammar priorities here.
          </div>
        )}
      </aside>
    </div>
  );
}

export { NewEntryPage };
