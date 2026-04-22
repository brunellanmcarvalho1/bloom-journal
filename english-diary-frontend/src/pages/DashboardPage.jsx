import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";

import { StatCard } from "../components/StatCard.jsx";
import { api } from "../lib/api.js";

const chartVariantColors = {
  diary: "#db7097",
  challenge: "#8f6de5",
  both: "#8f6de5",
  aggregate: "#db7097",
};

const chartViewLabels = {
  weekly: "Weekly",
  monthly: "Monthly",
};

const feedbackCategoryLabels = {
  verb_tense: "Verb tense",
  verb_conjugation: "Verb conjugation",
  spelling: "Spelling",
  preposition: "Preposition",
  article: "Article",
  word_choice: "Word choice",
  sentence_structure: "Sentence structure",
  punctuation: "Punctuation",
  capitalization: "Capitalization",
  agreement: "Agreement",
  other: "Grammar point",
};

const highValueCategories = [
  "verb_tense",
  "verb_conjugation",
  "preposition",
  "article",
  "word_choice",
  "sentence_structure",
  "agreement",
  "spelling",
];

const recurringErrorLabels = {
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

const criteriaLabels = [
  ["taskResponse", "Task Response"],
  ["coherenceAndCohesion", "Coherence & Cohesion"],
  ["lexicalResource", "Lexical Resource"],
  ["grammaticalRangeAndAccuracy", "Grammar Range & Accuracy"],
];

const criteriaDescriptions = {
  taskResponse:
    "How well your writing answers the task, develops ideas, and stays relevant.",
  coherenceAndCohesion:
    "How clearly your ideas are organized, connected, and easy to follow.",
  lexicalResource:
    "How accurate, varied, and natural your vocabulary, spelling, and word choice are.",
  grammaticalRangeAndAccuracy:
    "How well you use grammar structures, punctuation, and sentence variety.",
};

const softCardGradient = "from-white via-blush-50/78 to-blush-100/58";

function CustomBandTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-[1.2rem] border border-[#e7d7df] bg-white px-4 py-3 shadow-[0_18px_40px_rgba(118,72,101,0.08)]">
      <p className="font-medium text-plum-900">{label}</p>
      <p className="mt-2 text-sm font-bold" style={{ color: chartVariantColors[point.variant] }}>
        Estimated band: {point.band}
      </p>

      {point.entryCount ? (
        <p className="mt-2 text-sm text-ink-700">
          {point.entryCount} {point.entryCount === 1 ? "entry" : "entries"}
        </p>
      ) : point.variant === "both" ? (
        <div className="mt-2 space-y-1 text-sm text-ink-700">
          <p>Diary: {point.diaryBand}</p>
          <p>Challenge: {point.challengeBand}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-700">
          {point.variant === "challenge" ? "Challenge" : "Diary"}
        </p>
      )}
    </div>
  );
}

function CustomBandDot(props) {
  const { cx, cy, payload } = props;

  if (typeof cx !== "number" || typeof cy !== "number") {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.variant === "both" ? 7 : 6}
      fill={chartVariantColors[payload.variant] || chartVariantColors.diary}
      stroke="#fffdfd"
      strokeWidth={payload.variant === "both" ? 3 : 2.5}
    />
  );
}

function averageNumbers(values) {
  const validValues = values.filter((value) => typeof value === "number");

  if (!validValues.length) {
    return 0;
  }

  return Number(
    (validValues.reduce((sum, value) => sum + value, 0) / validValues.length).toFixed(1),
  );
}

function normalizeEntryDate(value) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getWeekStart(value) {
  const date = normalizeEntryDate(value);
  const day = date.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - daysFromMonday);
  return date;
}

function getMonthStart(value) {
  const date = normalizeEntryDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function formatDateLabel(value) {
  return normalizeEntryDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatWeekLabel(value) {
  const start = getWeekStart(value);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return `${formatDateLabel(start)}-${formatDateLabel(end)}`;
}

function formatMonthLabel(value) {
  return getMonthStart(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildChartData(entries, view) {
  const grouped = new Map();

  entries.forEach((entry) => {
    const band = entry.ielts?.estimatedBand;

    if (typeof band !== "number") {
      return;
    }

    const periodDate =
      view === "monthly"
        ? getMonthStart(entry.entryDate)
        : view === "weekly"
          ? getWeekStart(entry.entryDate)
          : normalizeEntryDate(entry.entryDate);
    const key = periodDate.toISOString();
    const existing = grouped.get(key) || {
      date: periodDate,
      bands: [],
      diaryBands: [],
      challengeBands: [],
      entryCount: 0,
      types: new Set(),
    };

    existing.bands.push(band);
    existing.entryCount += 1;
    existing.types.add(entry.entryType || "diary");

    if ((entry.entryType || "diary") === "challenge") {
      existing.challengeBands.push(band);
    } else {
      existing.diaryBands.push(band);
    }

    grouped.set(key, existing);
  });

  return Array.from(grouped.values())
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .map((item) => {
      const typeCount = item.types.size;
      const variant =
        view === "daily"
          ? typeCount > 1
            ? "both"
            : Array.from(item.types)[0] || "diary"
          : "aggregate";

      return {
        date: item.date,
        label:
          view === "monthly"
            ? formatMonthLabel(item.date)
            : view === "weekly"
              ? formatWeekLabel(item.date)
              : formatDateLabel(item.date),
        band: averageNumbers(item.bands),
        diaryBand: item.diaryBands.length ? averageNumbers(item.diaryBands) : null,
        challengeBand: item.challengeBands.length
          ? averageNumbers(item.challengeBands)
          : null,
        entryCount: view === "daily" ? null : item.entryCount,
        variant,
      };
    });
}

function detectMistakeCategory(mistake) {
  if (mistake?.category) {
    return mistake.category;
  }

  const text = `${mistake?.original || ""} ${mistake?.corrected || ""} ${mistake?.explanation || ""}`.toLowerCase();

  if (text.includes("tense") || text.includes("past") || text.includes("present")) {
    return "verb_tense";
  }

  if (text.includes("conjugat") || text.includes("verb form")) {
    return "verb_conjugation";
  }

  if (text.includes("spell")) {
    return "spelling";
  }

  if (text.includes("preposition")) {
    return "preposition";
  }

  if (text.includes("article") || text.includes("a/an") || text.includes("the ")) {
    return "article";
  }

  if (text.includes("word choice") || text.includes("more natural")) {
    return "word_choice";
  }

  if (text.includes("sentence") || text.includes("structure")) {
    return "sentence_structure";
  }

  if (text.includes("agree")) {
    return "agreement";
  }

  if (text.includes("punctuation")) {
    return "punctuation";
  }

  if (text.includes("capital")) {
    return "capitalization";
  }

  return "other";
}

function buildHelpfulFeedback(entry) {
  const ieltsCriteria = [
    entry.ielts?.taskResponse?.feedback && {
      title: "Task response",
      body: entry.ielts.taskResponse.feedback,
    },
    entry.ielts?.lexicalResource?.feedback && {
      title: "Lexical resource",
      body: entry.ielts.lexicalResource.feedback,
    },
    entry.ielts?.grammaticalRangeAndAccuracy?.feedback && {
      title: "Grammar range",
      body: entry.ielts.grammaticalRangeAndAccuracy.feedback,
    },
  ].filter(Boolean);

  if (ieltsCriteria.length) {
    return ieltsCriteria.slice(0, 2);
  }

  const prioritizedMistakes = (entry.mistakes || [])
    .map((mistake) => {
      const category = detectMistakeCategory(mistake);

      return {
        title: feedbackCategoryLabels[category] || "Grammar point",
        body:
          mistake.explanation ||
          `${mistake.corrected || mistake.original} is the better form here.`,
        rank: highValueCategories.includes(category)
          ? highValueCategories.indexOf(category)
          : 99,
      };
    })
    .filter((item) => item.rank < 99)
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 2);

  if (prioritizedMistakes.length) {
    return prioritizedMistakes;
  }

  const grammarTips = (entry.grammarFeedback || []).slice(0, 2).map((tip) => ({
    title: "Grammar tip",
    body: tip,
  }));

  if (grammarTips.length) {
    return grammarTips;
  }

  const suggestionTips = (entry.suggestions || []).slice(0, 2).map((tip) => ({
    title: "Writing tip",
    body: tip,
  }));

  if (suggestionTips.length) {
    return suggestionTips;
  }

  const fallbackMistakes = (entry.mistakes || []).slice(0, 2).map((mistake) => ({
    title: feedbackCategoryLabels[detectMistakeCategory(mistake)] || "Grammar point",
    body: mistake.explanation,
  }));

  return fallbackMistakes;
}

function formatTrend(currentCount, previousCount) {
  const difference = currentCount - previousCount;

  if (difference === 0) {
    return "Same as previous 30 days";
  }

  if (difference < 0) {
    return `${Math.abs(difference)} fewer than previous 30 days`;
  }

  return `${difference} more than previous 30 days`;
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState({
    totalEntries: 0,
    currentStreak: 0,
    averageScore: 0,
    latestScore: 0,
    averageIeltsBand: 0,
    latestIeltsBand: 0,
    criteriaAverages: {
      taskResponse: 0,
      coherenceAndCohesion: 0,
      lexicalResource: 0,
      grammaticalRangeAndAccuracy: 0,
    },
    recurringErrors: [],
    scoreSeries: [],
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [chartView, setChartView] = useState("weekly");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/api/diary/dashboard"), api.get("/api/diary/entries")])
      .then(([dashboardResponse, entriesResponse]) => {
        const entries = entriesResponse.data.entries || [];

        setDashboard(dashboardResponse.data);
        setAllEntries(entries);
        setRecentEntries(entries.slice(0, 3));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const chartData = buildChartData(allEntries, chartView);

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-rose-700/75">
          Dashboard
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-5xl text-plum-900 md:text-6xl">
              Your English is blooming.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-700">
              Watch your scores, consistency, and writing confidence grow over
              time.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Entries"
            value={dashboard.totalEntries}
            help="Every diary entry becomes a little proof of progress."
          />
          <StatCard
            label="Current Streak"
            value={dashboard.currentStreak}
            help="Keep the streak alive by writing again today."
            accent="from-peach-100 to-butter-100"
          />
          <StatCard
            label="Average Band"
            value={dashboard.averageIeltsBand || "-"}
            help="Your average writing band across saved entries."
            accent="from-lilac-100 to-blush-100"
          />
          <StatCard
            label="Latest Band"
            value={dashboard.latestIeltsBand || "-"}
            help="Your most recent writing band estimate."
            accent="from-mint-100 to-blush-100"
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <section className="glass-panel relative z-20 rounded-[2.2rem] border border-white/70 p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-700/75">
                Band Journey
              </p>
              <h3 className="mt-2 font-display text-4xl text-plum-900">
                Writing trend
              </h3>
            </div>
            <div className="inline-flex w-fit rounded-full bg-blush-100 p-1">
              {Object.entries(chartViewLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChartView(value)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-bold transition",
                    chartView === value
                      ? "bg-white text-rose-700 shadow-sm"
                      : "text-ink-700 hover:text-rose-700",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 h-80">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-ink-700">
                Loading your progress...
              </div>
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#db7097" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#db7097" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f3dce6" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: "#8b7a87", fontSize: 12 }} />
                  <YAxis domain={[0, 9]} tick={{ fill: "#8b7a87", fontSize: 12 }} />
                  <Tooltip content={<CustomBandTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="band"
                    stroke="#db7097"
                    strokeWidth={3}
                    fill="url(#scoreFill)"
                    dot={<CustomBandDot />}
                    activeDot={{ r: 8, fill: "#db7097", stroke: "#fffdfd", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.7rem] bg-blush-50 px-8 text-center text-ink-700">
                Your chart will appear after your first saved diary entry.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {criteriaLabels.map(([key, label]) => (
              <div
                key={key}
                tabIndex={0}
                className={`group relative rounded-[1.35rem] bg-linear-to-br ${softCardGradient} px-4 py-4 outline-none focus:ring-2 focus:ring-rose-300`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700">
                  {label}
                </p>
                <p className="mt-2 font-display text-4xl text-plum-900">
                  {dashboard.criteriaAverages[key] || "-"}
                </p>
                <div className="pointer-events-none absolute bottom-full left-4 z-50 mb-3 w-64 rounded-[1rem] border border-rose-100 bg-white px-4 py-3 text-sm leading-6 text-ink-700 opacity-0 shadow-[0_18px_40px_rgba(118,72,101,0.14)] transition group-hover:opacity-100 group-focus:opacity-100">
                  <p className="font-bold text-plum-900">{label}</p>
                  <p className="mt-1">{criteriaDescriptions[key]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-700/75">
            Writing Coaching
          </p>
          <h3 className="mt-2 font-display text-4xl text-plum-900">
            Latest guidance
          </h3>

          <div className="mt-6 space-y-3">
            {recentEntries.length ? (
              recentEntries.map((entry) => {
                const helpfulFeedback = buildHelpfulFeedback(entry);

                return (
                  <article
                    key={entry._id}
                    className="rounded-[1.5rem] bg-white/70 p-4 text-sm text-ink-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-plum-900">
                        {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                      </span>
                      <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-bold text-rose-700">
                        Band {entry.ielts?.estimatedBand || "-"}
                      </span>
                    </div>

                    {entry.ielts?.summary ? (
                      <p className="mt-3 rounded-xl bg-linear-to-r from-blush-50 to-peach-100 px-3 py-3 leading-6 text-plum-900">
                        {entry.ielts.summary}
                      </p>
                    ) : null}

                    {helpfulFeedback.length ? (
                      <div className="mt-3 space-y-2">
                        {helpfulFeedback.map((item, index) => (
                          <div
                            key={`${entry._id}-feedback-${index}`}
                            className="rounded-xl bg-blush-50 px-3 py-2"
                          >
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                              {item.title}
                            </p>
                            <p className="mt-1 line-clamp-2 leading-6">{item.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl bg-blush-50 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                          Grammar tip
                        </p>
                        <p className="mt-1 line-clamp-2 leading-6">
                          Keep writing consistently to build fluency and confidence.
                        </p>
                      </div>
                    )}

                    {entry.vocabularyUpgrades?.length ? (
                      <div className="mt-3 rounded-xl bg-white/80 px-3 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                          Vocabulary upgrade
                        </p>
                        <p className="mt-1 leading-6 text-plum-900">
                          Try <span className="font-bold">{entry.vocabularyUpgrades[0].improved}</span> instead of{" "}
                          <span className="font-bold">{entry.vocabularyUpgrades[0].original}</span>.
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] bg-blush-50 p-4 text-sm leading-6 text-ink-700">
                No entries yet. Your latest grammar tips will show up here after
                you save your first diary note.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-[2.2rem] border border-white/70 p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-700/75">
              Study Plan
            </p>
            <h3 className="mt-2 font-display text-4xl text-plum-900">
              Your recurring patterns
            </h3>
          </div>
        </div>

        {dashboard.recurringErrors.length ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.recurringErrors.map((item) => (
              <Link
                key={item.category}
                to={`/study/${item.category}`}
                className={`rounded-[1.4rem] bg-linear-to-br ${softCardGradient} p-4`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
                  {recurringErrorLabels[item.category] || "Grammar point"}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ink-500">
                  Last {item.periodDays || 30} days
                </p>
                <p className="mt-2 font-display text-4xl text-plum-900">{item.count}</p>
                <p className="mt-1 text-xs font-bold text-rose-700">
                  {formatTrend(item.count, item.previousCount || 0)}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  {item.examples[0] ||
                    "This pattern appears often enough to deserve focused practice."}
                </p>
                <p className="mt-4 text-sm font-bold text-rose-700">
                  Study this
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] bg-blush-50 p-4 text-sm leading-6 text-ink-700">
            Save a few diary entries and the app will highlight the grammar areas
            you should focus on next.
          </div>
        )}
      </section>
    </div>
  );
}

export { DashboardPage };
