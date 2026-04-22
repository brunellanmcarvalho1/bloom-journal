import mongoose from "mongoose";

const diaryEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entryDate: {
      type: Date,
      required: true,
    },
    entryType: {
      type: String,
      enum: ["diary", "challenge"],
      default: "diary",
      required: true,
    },
    challengePrompt: {
      type: String,
      trim: true,
      default: "",
    },
    originalText: {
      type: String,
      required: true,
      trim: true,
    },
    correctedText: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    wordCount: {
      type: Number,
      required: true,
      min: 0,
    },
    meetsMinimumWords: {
      type: Boolean,
      required: true,
    },
    mistakes: [
      {
        category: String,
        original: String,
        corrected: String,
        explanation: String,
      },
    ],
    grammarFeedback: [String],
    suggestions: [String],
    ielts: {
      estimatedBand: {
        type: Number,
        min: 0,
        max: 9,
      },
      summary: String,
      taskResponse: {
        band: {
          type: Number,
          min: 0,
          max: 9,
        },
        feedback: String,
      },
      coherenceAndCohesion: {
        band: {
          type: Number,
          min: 0,
          max: 9,
        },
        feedback: String,
      },
      lexicalResource: {
        band: {
          type: Number,
          min: 0,
          max: 9,
        },
        feedback: String,
      },
      grammaticalRangeAndAccuracy: {
        band: {
          type: Number,
          min: 0,
          max: 9,
        },
        feedback: String,
      },
    },
    vocabularyUpgrades: [
      {
        original: String,
        improved: String,
        reason: String,
      },
    ],
    studyFocus: [String],
  },
  {
    timestamps: true,
  },
);

diaryEntrySchema.index({ user: 1, entryDate: 1, entryType: 1 }, { unique: true });

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);

export { DiaryEntry };
