import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Lightbulb, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { api } from "../lib/api.js";

const studyLabels = {
  verb_tense: "Verb tense",
  verb_conjugation: "Verb conjugation",
  spelling: "Spelling",
  preposition: "Prepositions",
  article: "Articles",
  word_choice: "Word choice",
  sentence_structure: "Sentence structure",
  punctuation: "Punctuation",
  capitalization: "Capitalization",
  agreement: "Agreement",
  other: "Grammar point",
};

const studyGuides = {
  verb_tense: {
    focus: "Keep the time of the action clear: past, present, future, or ongoing.",
    tips: [
      "Before writing the sentence, ask: when did this happen?",
      "Use one main tense in a paragraph unless the time changes clearly.",
      "After writing, underline every verb and check if the time matches your meaning.",
    ],
  },
  verb_conjugation: {
    focus: "Make the verb form match the subject and tense.",
    tips: [
      "Check third-person singular in the present: she works, he studies, it feels.",
      "For past tense, check if the verb is regular or irregular.",
      "Read the subject and verb together out loud to catch forms that feel off.",
    ],
  },
  spelling: {
    focus: "Notice words that look close to correct but need one small adjustment.",
    tips: [
      "Create a tiny personal list of words you misspell often.",
      "Look for doubled letters, silent letters, and vowel swaps.",
      "Rewrite the corrected word three times inside a real sentence.",
    ],
  },
  preposition: {
    focus: "Learn prepositions as phrases, not single translated words.",
    tips: [
      "Save full chunks like interested in, good at, depend on, and arrive at.",
      "Check whether the phrase talks about time, place, direction, or relationship.",
      "When unsure, search or ask for the whole phrase instead of one preposition.",
    ],
  },
  article: {
    focus: "Decide if the noun is general, specific, countable, or uncountable.",
    tips: [
      "Use a or an for one non-specific countable thing.",
      "Use the when the reader knows exactly which thing you mean.",
      "Use no article for general plural nouns and many uncountable nouns.",
    ],
  },
  word_choice: {
    focus: "Choose words that sound natural in your exact context.",
    tips: [
      "Prefer simple natural words over advanced words that do not fit the sentence.",
      "Compare your phrase with the corrected version and notice the situation.",
      "Keep useful collocations, like make progress or take a break.",
    ],
  },
  sentence_structure: {
    focus: "Make each sentence easy to follow from subject to verb to idea.",
    tips: [
      "Keep one main idea per sentence when practicing accuracy.",
      "Use connectors like because, although, and however only when the logic is clear.",
      "If a sentence feels too long, split it and rebuild it calmly.",
    ],
  },
  punctuation: {
    focus: "Use punctuation to guide the reader through your ideas.",
    tips: [
      "Use periods to finish complete thoughts.",
      "Use commas after opening phrases when the sentence needs a small pause.",
      "Read the sentence aloud and mark where the reader naturally pauses.",
    ],
  },
  capitalization: {
    focus: "Capitalize names, places, languages, days, months, and the pronoun I.",
    tips: [
      "Scan the start of every sentence.",
      "Check English, Monday, April, Brazil, Amsterdam, and I.",
      "Use capitalization checks after grammar checks so you focus on meaning first.",
    ],
  },
  agreement: {
    focus: "Make subjects, verbs, and nouns agree in number.",
    tips: [
      "Find the real subject before choosing the verb.",
      "Check singular and plural nouns near this, that, these, and those.",
      "Read the short core sentence without extra details.",
    ],
  },
  other: {
    focus: "Look for the repeated pattern and turn it into one small practice rule.",
    tips: [
      "Group similar corrections together.",
      "Write one rule in your own words.",
      "Practice the rule with three new sentences about your real life.",
    ],
  },
};

const correctionsPageSize = 8;
const recentPeriodDays = 30;

function normalizeCategory(value) {
  return Object.prototype.hasOwnProperty.call(studyLabels, value) ? value : "other";
}

function normalizeEntryDate(value) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getPeriodStart(daysAgo) {
  const date = normalizeEntryDate(new Date());
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

function isInPeriod(value, startDate, endDate) {
  const date = normalizeEntryDate(value);
  return date >= startDate && date < endDate;
}

function getMonthKey(value) {
  const date = normalizeEntryDate(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatTrend(currentCount, previousCount) {
  const difference = currentCount - previousCount;

  if (difference === 0) {
    return "Same as the previous 30 days";
  }

  if (difference < 0) {
    return `${Math.abs(difference)} fewer than the previous 30 days`;
  }

  return `${difference} more than the previous 30 days`;
}

function StudyPage() {
  const { category } = useParams();
  const activeCategory = normalizeCategory(category);
  const guide = studyGuides[activeCategory] || studyGuides.other;
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCountsByCategory, setVisibleCountsByCategory] = useState({});

  useEffect(() => {
    api
      .get("/api/diary/entries")
      .then((response) => {
        setEntries(response.data.entries || []);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const studyMistakes = useMemo(
    () =>
      entries.flatMap((entry) =>
        (entry.mistakes || [])
          .filter((mistake) => normalizeCategory(mistake.category) === activeCategory)
          .map((mistake) => ({
            ...mistake,
            entryId: entry._id,
            date: entry.entryDate,
            band: entry.ielts?.estimatedBand,
          })),
      ),
    [activeCategory, entries],
  );

  const visibleMistakesCount =
    visibleCountsByCategory[activeCategory] || correctionsPageSize;
  const visibleMistakes = studyMistakes.slice(0, visibleMistakesCount);
  const hasMoreMistakes = visibleMistakes.length < studyMistakes.length;
  const currentPeriodStart = getPeriodStart(recentPeriodDays);
  const previousPeriodStart = getPeriodStart(recentPeriodDays * 2);
  const now = new Date();
  const recentMistakesCount = studyMistakes.filter((mistake) =>
    isInPeriod(mistake.date, currentPeriodStart, now),
  ).length;
  const previousMistakesCount = studyMistakes.filter((mistake) =>
    isInPeriod(mistake.date, previousPeriodStart, currentPeriodStart),
  ).length;
  const monthlyProgress = Object.entries(
    studyMistakes.reduce((counts, mistake) => {
      const monthKey = getMonthKey(mistake.date);
      return {
        ...counts,
        [monthKey]: (counts[monthKey] || 0) + 1,
      };
    }, {}),
  )
    .sort(([left], [right]) => right.localeCompare(left))
    .slice(0, 4);

  function handleLoadMore() {
    setVisibleCountsByCategory((current) => ({
      ...current,
      [activeCategory]:
        (current[activeCategory] || correctionsPageSize) + correctionsPageSize,
    }));
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-white"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-rose-700/75">
          Study Plan
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-5xl text-plum-900 md:text-6xl">
              {studyLabels[activeCategory]}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
              {guide.focus}
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-blush-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
              Last {recentPeriodDays} days
            </p>
            <p className="mt-2 font-display text-4xl text-plum-900">
              {recentMistakesCount}
            </p>
            <p className="mt-1 text-sm font-bold text-rose-700">
              {formatTrend(recentMistakesCount, previousMistakesCount)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <section className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-rose-700">
              <BookOpen size={18} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-700/75">
                Your Examples
              </p>
              <h3 className="mt-1 font-display text-4xl text-plum-900">
                Corrections to review
              </h3>
              {!isLoading && studyMistakes.length ? (
                <p className="mt-1 text-sm text-ink-700">
                  Showing {visibleMistakes.length} of {studyMistakes.length}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isLoading ? (
              <div className="rounded-[1.5rem] bg-blush-50 p-4 text-sm text-ink-700">
                Loading your study notes...
              </div>
            ) : visibleMistakes.length ? (
              <>
                {visibleMistakes.map((mistake, index) => (
                  <article
                    key={`${mistake.entryId}-${index}`}
                    className="rounded-[1.5rem] bg-white/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-bold text-plum-900">
                        {new Date(mistake.date).toLocaleDateString("en-GB")}
                      </p>
                      <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-bold text-rose-700">
                        Band {mistake.band || "-"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl bg-blush-50 px-3 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                          Original
                        </p>
                        <p className="mt-1 text-sm leading-6 text-ink-700">
                          {mistake.original || "Original phrase not saved."}
                        </p>
                      </div>
                      <div className="rounded-xl bg-mint-100/70 px-3 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                          Better
                        </p>
                        <p className="mt-1 text-sm font-bold leading-6 text-plum-900">
                          {mistake.corrected || "Review the correction."}
                        </p>
                      </div>
                    </div>

                    {mistake.explanation ? (
                      <p className="mt-3 rounded-xl bg-linear-to-r from-blush-50 to-peach-100 px-3 py-3 text-sm leading-6 text-ink-700">
                        {mistake.explanation}
                      </p>
                    ) : null}
                  </article>
                ))}

                {hasMoreMistakes ? (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="w-full rounded-[1.3rem] border border-rose-200 bg-white/70 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                  >
                    Load more corrections
                  </button>
                ) : null}
              </>
            ) : (
              <div className="rounded-[1.5rem] bg-blush-50 p-4 text-sm leading-6 text-ink-700">
                No saved corrections for this topic yet. Once this pattern appears
                in your diary entries, the examples will show up here.
              </div>
            )}
          </div>
        </section>

        <aside className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-peach-100 text-rose-700">
              <Lightbulb size={18} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-700/75">
                Tips
              </p>
              <h3 className="mt-1 font-display text-4xl text-plum-900">
                Practice next
              </h3>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {guide.tips.map((tip, index) => (
              <div
                key={tip}
                className="rounded-[1.4rem] bg-linear-to-br from-white via-blush-50/78 to-blush-100/58 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-rose-700">
                    <Sparkles size={14} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-700">{tip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {monthlyProgress.length ? (
            <div className="mt-6 rounded-[1.4rem] bg-white/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
                Monthly progress
              </p>
              <div className="mt-3 space-y-3">
                {monthlyProgress.map(([monthKey, count]) => (
                  <div
                    key={monthKey}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="font-bold text-plum-900">
                      {formatMonthLabel(monthKey)}
                    </span>
                    <span className="rounded-full bg-blush-100 px-3 py-1 font-bold text-rose-700">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export { StudyPage };
