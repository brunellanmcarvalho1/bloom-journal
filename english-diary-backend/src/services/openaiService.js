import OpenAI from "openai";

function clampNumber(value, min, max) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.min(max, Math.max(min, value));
}

function roundToHalf(value) {
  const clamped = clampNumber(value, 0, 9);

  if (clamped === null) {
    return null;
  }

  return Math.round(clamped * 2) / 2;
}

function normalizeBand(value) {
  return roundToHalf(value);
}

function averageBands(values) {
  const validBands = values.filter((value) => typeof value === "number");

  if (!validBands.length) {
    return null;
  }

  return roundToHalf(
    validBands.reduce((sum, value) => sum + value, 0) / validBands.length,
  );
}

async function analyzeText(text, options = {}) {
  const entryType = options.entryType === "challenge" ? "challenge" : "diary";
  const challengePrompt = options.challengePrompt?.trim() || "";

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an English teacher specialized in correcting writing written by language learners and turning it into high-value feedback. Return clear, kind, practical guidance. Prioritize meaningful issues such as verb tense, verb conjugation, prepositions, articles, sentence structure, word choice, spelling, cohesion, and clarity. Do not focus mainly on tiny formatting issues like capitalizing 'I' unless there are no more important issues. When suggesting vocabulary, recommend words or phrases that fit the student's actual context and sound natural, not artificially advanced.",
      },
      {
        role: "user",
        content: `
Analyze the following English text.

Writing mode: ${entryType}
${challengePrompt ? `Prompt: ${challengePrompt}` : ""}

Text: ${text}

Requirements:

1. Give a score from 0 to 10 based on grammar, clarity, vocabulary and naturalness
2. Count the number of words
3. Indicate if the text meets a minimum of 100 words
4. Provide the corrected version of the text
5. Identify the main mistakes with direct corrections
6. For each mistake, include a category chosen from: "verb_tense", "verb_conjugation", "spelling", "preposition", "article", "word_choice", "sentence_structure", "punctuation", "capitalization", "agreement", or "other"
7. Provide 2 to 3 broader grammar explanations focused on real grammar learning
8. Prefer grammar patterns and language-use issues over tiny formatting issues
9. Provide practical suggestions so the student can improve future entries
10. Estimate a writing band from 0 to 9 for this text as practice feedback
11. Evaluate the text using the 4 IELTS Writing criteria:
   - Task Response
   - Coherence and Cohesion
   - Lexical Resource
   - Grammatical Range and Accuracy
12. For each IELTS criterion, provide a band and a short explanation in plain English
13. Suggest 3 to 5 vocabulary upgrades: words or phrases the student used that could be replaced by something more natural, precise, or context-appropriate
14. Give 2 to 3 study focus points for the next practice sessions

Band calibration rules:
- Grade like an impartial IELTS Writing examiner. Do not adjust the band to satisfy the student, the app, or any expected outcome.
- Use the full 0 to 9 scale. Do not default to any middle score.
- Award only .0 or .5 bands.
- The estimated band must reflect the four criteria, not a generic middle score.
- Use Task Response for relevance, completeness, position, idea development, and support. In challenge mode, judge it like IELTS Writing Task 2. In diary mode, judge whether the writing fulfills its communicative purpose without requiring essay structure.
- Use Coherence and Cohesion for logical organization, progression, paragraphing, referencing, and cohesive devices.
- Use Lexical Resource for vocabulary range, precision, collocation, spelling, and word formation.
- Use Grammatical Range and Accuracy for sentence variety, control, punctuation, and how often errors affect communication.
- Text length should affect the relevant criteria only when it limits development, support, range, or clarity. Do not apply an automatic score cap based only on word count.
- If the text is accurate, organized, and natural, use higher bands when the criteria justify it.
- If the text has frequent grammar errors that affect clarity, Grammatical Range and Accuracy should be lower.
- Choose each band independently. Similar texts can receive the same score, but only when the criteria justify it.

IELTS-style band descriptor guide:
- Band 9: fully addresses the task, very natural and precise language, excellent cohesion, full grammatical flexibility and accuracy, with only rare slips.
- Band 8: well-developed response, logical sequencing, wide and flexible vocabulary, wide grammatical range, and only occasional inaccuracies.
- Band 7: clear position and progression, sufficient vocabulary range, variety of complex structures, and a few errors that do not usually reduce communication.
- Band 6: relevant response with some development, clear overall progression, adequate vocabulary, mix of simple and complex forms, and errors that rarely reduce communication.
- Band 5: partial or limited development, some organization but weak progression, limited vocabulary, limited structures, and frequent noticeable errors that may cause difficulty.
- Band 4: limited response, unclear progression, basic vocabulary, very limited structures, and frequent errors that often make meaning difficult.
- Band 3 or below: very limited communication, minimal organization, very limited vocabulary and grammar, or meaning often fails.

Return ONLY valid JSON in this exact format:

{
  "corrected_text": "...",
  "score": 0,
  "word_count": 0,
  "meets_minimum_words": true,
  "mistakes": [
    {
      "category": "verb_tense",
      "original": "...",
      "corrected": "...",
      "explanation": "..."
    }
  ],
  "grammar_feedback": [
    "..."
  ],
  "suggestions": [
    "..."
  ],
  "ielts": {
    "estimated_band": 0,
    "summary": "...",
    "task_response": {
      "band": 0,
      "feedback": "..."
    },
    "coherence_and_cohesion": {
      "band": 0,
      "feedback": "..."
    },
    "lexical_resource": {
      "band": 0,
      "feedback": "..."
    },
    "grammatical_range_and_accuracy": {
      "band": 0,
      "feedback": "..."
    }
  },
  "vocabulary_upgrades": [
    {
      "original": "...",
      "improved": "...",
      "reason": "..."
    }
  ],
  "study_focus": [
    "..."
  ]
}
        `,
      },
    ],
  });

  const raw = response.choices[0].message.content;

  try {
    const parsed = JSON.parse(raw);
    const taskResponseBand = normalizeBand(parsed.ielts?.task_response?.band);
    const coherenceBand = normalizeBand(parsed.ielts?.coherence_and_cohesion?.band);
    const lexicalBand = normalizeBand(parsed.ielts?.lexical_resource?.band);
    const grammarBand = normalizeBand(
      parsed.ielts?.grammatical_range_and_accuracy?.band,
    );
    const estimatedBand =
      averageBands([
        taskResponseBand,
        coherenceBand,
        lexicalBand,
        grammarBand,
      ]) ??
      normalizeBand(parsed.ielts?.estimated_band);

    return {
      corrected_text: parsed.corrected_text || text,
      score: clampNumber(parsed.score, 0, 10) ?? 0,
      word_count: parsed.word_count ?? 0,
      meets_minimum_words: Boolean(parsed.meets_minimum_words),
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      grammar_feedback: Array.isArray(parsed.grammar_feedback)
        ? parsed.grammar_feedback
        : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      ielts: {
        estimated_band: estimatedBand,
        summary: parsed.ielts?.summary || "",
        task_response: {
          band: taskResponseBand,
          feedback: parsed.ielts?.task_response?.feedback || "",
        },
        coherence_and_cohesion: {
          band: coherenceBand,
          feedback: parsed.ielts?.coherence_and_cohesion?.feedback || "",
        },
        lexical_resource: {
          band: lexicalBand,
          feedback: parsed.ielts?.lexical_resource?.feedback || "",
        },
        grammatical_range_and_accuracy: {
          band: grammarBand,
          feedback:
            parsed.ielts?.grammatical_range_and_accuracy?.feedback || "",
        },
      },
      vocabulary_upgrades: Array.isArray(parsed.vocabulary_upgrades)
        ? parsed.vocabulary_upgrades
        : [],
      study_focus: Array.isArray(parsed.study_focus) ? parsed.study_focus : [],
    };
  } catch (error) {
    console.error("JSON PARSE ERROR:", raw);
    throw new Error("Invalid JSON from AI response");
  }
}

export { analyzeText };
