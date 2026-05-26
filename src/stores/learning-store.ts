import { create } from "zustand";
import type { Sentence, LearningCard, StudySession } from "@/types/domain";

interface LearningState {
  activeSession: StudySession | null;
  currentSentence: Sentence | null;
  currentCard: LearningCard | null;
  sessionCards: LearningCard[];
  cardIndex: number;

  startSession: (session: StudySession, cards: LearningCard[]) => void;
  nextCard: () => void;
  setCurrentSentence: (s: Sentence | null) => void;
  endSession: (stats: { correct: number; reviewed: number }) => void;
}

export const useLearningStore = create<LearningState>()((set) => ({
  activeSession: null,
  currentSentence: null,
  currentCard: null,
  sessionCards: [],
  cardIndex: 0,

  startSession: (session, cards) =>
    set({
      activeSession: session,
      sessionCards: cards,
      cardIndex: 0,
      currentCard: cards[0] ?? null,
    }),

  nextCard: () =>
    set((s) => {
      const next = s.cardIndex + 1;
      return {
        cardIndex: next,
        currentCard: s.sessionCards[next] ?? null,
        currentSentence: null,
      };
    }),

  setCurrentSentence: (sentence) => set({ currentSentence: sentence }),

  endSession: (stats) =>
    set((s) => {
      if (!s.activeSession) return {};
      return {
        activeSession: {
          ...s.activeSession,
          endTime: Date.now(),
          cardsReviewed: stats.reviewed,
          cardsCorrect: stats.correct,
          totalTimeSpentMs:
            Date.now() - s.activeSession.startTime,
        },
      };
    }),
}));
