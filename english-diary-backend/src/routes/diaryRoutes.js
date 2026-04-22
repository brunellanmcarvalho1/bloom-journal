import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { DiaryEntry } from "../models/DiaryEntry.js";
import { analyzeText } from "../services/openaiService.js";

const diaryRoutes = express.Router();

function normalizeEntryDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function calculateCurrentStreak(entries) {
  if (!entries.length) {
    return 0;
  }

  const entryDays = new Set(
    entries.map((entry) => normalizeEntryDate(entry.entryDate).toISOString()),
  );

  const today = normalizeEntryDate(new Date());
  let streak = 0;
  let cursor = today;

  while (entryDays.has(cursor.toISOString())) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
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

function getPeriodStart(daysAgo) {
  const date = normalizeEntryDate(new Date());
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

function isEntryInPeriod(entry, startDate, endDate) {
  const entryDate = normalizeEntryDate(entry.entryDate);
  return entryDate >= startDate && entryDate < endDate;
}

function buildRecurringErrors(entries) {
  const totals = new Map();
  const now = new Date();
  const currentStart = getPeriodStart(30);
  const previousStart = getPeriodStart(60);
  const previousTotals = new Map();

  entries.forEach((entry) => {
    const isCurrentPeriod = isEntryInPeriod(entry, currentStart, now);
    const isPreviousPeriod = isEntryInPeriod(entry, previousStart, currentStart);

    (entry.mistakes || []).forEach((mistake) => {
      const category = mistake.category || "other";

      if (isPreviousPeriod) {
        previousTotals.set(category, (previousTotals.get(category) || 0) + 1);
      }

      if (!isCurrentPeriod) {
        return;
      }

      const current = totals.get(category) || { category, count: 0, examples: [] };

      current.count += 1;

      if (
        mistake.explanation &&
        current.examples.length < 2 &&
        !current.examples.includes(mistake.explanation)
      ) {
        current.examples.push(mistake.explanation);
      }

      totals.set(category, current);
    });
  });

  return Array.from(totals.values())
    .map((item) => ({
      ...item,
      previousCount: previousTotals.get(item.category) || 0,
      periodDays: 30,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function buildBandSeries(entries) {
  const groupedByDate = new Map();

  entries.forEach((entry) => {
    if (typeof entry.ielts?.estimatedBand !== "number") {
      return;
    }

    const normalizedDate = normalizeEntryDate(entry.entryDate);
    const dateKey = normalizedDate.toISOString();
    const existing = groupedByDate.get(dateKey) || {
      date: normalizedDate,
      diaryBand: null,
      challengeBand: null,
      types: new Set(),
      wordCount: 0,
    };

    existing.types.add(entry.entryType || "diary");
    existing.wordCount += entry.wordCount || 0;

    if ((entry.entryType || "diary") === "challenge") {
      existing.challengeBand = entry.ielts.estimatedBand;
    } else {
      existing.diaryBand = entry.ielts.estimatedBand;
    }

    groupedByDate.set(dateKey, existing);
  });

  return Array.from(groupedByDate.values()).map((item) => {
    const variant =
      item.types.size > 1
        ? "both"
        : item.types.has("challenge")
          ? "challenge"
          : "diary";

    const bands = [item.diaryBand, item.challengeBand].filter(
      (value) => typeof value === "number",
    );

    return {
      date: item.date,
      band: averageNumbers(bands),
      diaryBand: item.diaryBand,
      challengeBand: item.challengeBand,
      variant,
      wordCount: item.wordCount,
    };
  });
}

diaryRoutes.use(authMiddleware);

diaryRoutes.post("/analyze", async (req, res) => {
  const { text, entryType, challengePrompt } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }

  const result = await analyzeText(text, { entryType, challengePrompt });
  res.json(result);
});

diaryRoutes.post("/entries", async (req, res) => {
  const { text, entryDate, entryType, challengePrompt } = req.body;
  const normalizedEntryType = entryType === "challenge" ? "challenge" : "diary";

  if (!text?.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }

  const normalizedDate = normalizeEntryDate(entryDate);

  if (!normalizedDate) {
    return res.status(400).json({ error: "Invalid entry date" });
  }

  const existingEntry = await DiaryEntry.findOne({
    user: req.user._id,
    entryDate: normalizedDate,
    entryType: normalizedEntryType,
  });

  if (existingEntry) {
    return res
      .status(409)
      .json({ error: `You already have a ${normalizedEntryType} entry for this day` });
  }

  const analysis = await analyzeText(text, {
    entryType: normalizedEntryType,
    challengePrompt,
  });

  const entry = await DiaryEntry.create({
    user: req.user._id,
    entryDate: normalizedDate,
    entryType: normalizedEntryType,
    challengePrompt: normalizedEntryType === "challenge" ? challengePrompt || "" : "",
    originalText: text,
    correctedText: analysis.corrected_text,
    score: analysis.score,
    wordCount: analysis.word_count,
    meetsMinimumWords: analysis.meets_minimum_words,
    mistakes: (analysis.mistakes || []).map((mistake) => ({
      category: mistake.category || "other",
      original: mistake.original,
      corrected: mistake.corrected,
      explanation: mistake.explanation,
    })),
    grammarFeedback: analysis.grammar_feedback || [],
    suggestions: analysis.suggestions || [],
    ielts: {
      estimatedBand: analysis.ielts?.estimated_band ?? null,
      summary: analysis.ielts?.summary || "",
      taskResponse: {
        band: analysis.ielts?.task_response?.band ?? null,
        feedback: analysis.ielts?.task_response?.feedback || "",
      },
      coherenceAndCohesion: {
        band: analysis.ielts?.coherence_and_cohesion?.band ?? null,
        feedback: analysis.ielts?.coherence_and_cohesion?.feedback || "",
      },
      lexicalResource: {
        band: analysis.ielts?.lexical_resource?.band ?? null,
        feedback: analysis.ielts?.lexical_resource?.feedback || "",
      },
      grammaticalRangeAndAccuracy: {
        band: analysis.ielts?.grammatical_range_and_accuracy?.band ?? null,
        feedback: analysis.ielts?.grammatical_range_and_accuracy?.feedback || "",
      },
    },
    vocabularyUpgrades: (analysis.vocabulary_upgrades || []).map((item) => ({
      original: item.original,
      improved: item.improved,
      reason: item.reason,
    })),
    studyFocus: analysis.study_focus || [],
  });

  res.status(201).json({ entry });
});

diaryRoutes.get("/entries", async (req, res) => {
  const entries = await DiaryEntry.find({ user: req.user._id }).sort({
    entryDate: -1,
    createdAt: -1,
  });

  res.json({ entries });
});

diaryRoutes.get("/entries/:id", async (req, res) => {
  const entry = await DiaryEntry.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!entry) {
    return res.status(404).json({ error: "Entry not found" });
  }

  res.json({ entry });
});

diaryRoutes.delete("/entries/:id", async (req, res) => {
  const deletedEntry = await DiaryEntry.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!deletedEntry) {
    return res.status(404).json({ error: "Entry not found" });
  }

  res.json({ success: true });
});

diaryRoutes.get("/calendar", async (req, res) => {
  const entries = await DiaryEntry.find({ user: req.user._id })
    .select("entryDate entryType ielts.estimatedBand")
    .sort({ entryDate: -1 });

  const groupedByDate = new Map();

  entries.forEach((entry) => {
    const normalizedDate = normalizeEntryDate(entry.entryDate);
    const dateKey = normalizedDate.toISOString();
    const existing = groupedByDate.get(dateKey) || {
      id: dateKey,
      date: normalizedDate,
      variant: "diary",
      band: 0,
      entries: [],
    };

    existing.entries.push({
      id: entry._id,
      type: entry.entryType || "diary",
      band: entry.ielts?.estimatedBand ?? null,
    });
    existing.band = averageNumbers(
      existing.entries.map((item) => item.band).filter((value) => typeof value === "number"),
    );

    const typeSet = new Set(existing.entries.map((item) => item.type));
    existing.variant =
      typeSet.size > 1 ? "both" : existing.entries[0]?.type || "diary";

    groupedByDate.set(dateKey, existing);
  });

  const calendar = Array.from(groupedByDate.values()).sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );

  res.json({ calendar });
});

diaryRoutes.get("/dashboard", async (req, res) => {
  const entries = await DiaryEntry.find({ user: req.user._id }).sort({
    entryDate: 1,
  });

  const scoreSeries = buildBandSeries(entries);

  const averageScore = entries.length
    ? Number(
        (
          entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length
        ).toFixed(1),
      )
    : 0;

  const averageIeltsBand = averageNumbers(
    entries.map((entry) => entry.ielts?.estimatedBand),
  );

  const criteriaAverages = {
    taskResponse: averageNumbers(entries.map((entry) => entry.ielts?.taskResponse?.band)),
    coherenceAndCohesion: averageNumbers(
      entries.map((entry) => entry.ielts?.coherenceAndCohesion?.band),
    ),
    lexicalResource: averageNumbers(
      entries.map((entry) => entry.ielts?.lexicalResource?.band),
    ),
    grammaticalRangeAndAccuracy: averageNumbers(
      entries.map((entry) => entry.ielts?.grammaticalRangeAndAccuracy?.band),
    ),
  };

  res.json({
    totalEntries: entries.length,
    currentStreak: calculateCurrentStreak(entries),
    averageScore,
    latestScore: entries.length ? entries[entries.length - 1].score : 0,
    averageIeltsBand,
    latestIeltsBand: entries.length
      ? entries[entries.length - 1].ielts?.estimatedBand || 0
      : 0,
    criteriaAverages,
    recurringErrors: buildRecurringErrors(entries),
    scoreSeries,
  });
});

export { diaryRoutes };
