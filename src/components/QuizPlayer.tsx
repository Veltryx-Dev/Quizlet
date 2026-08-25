import React, { useState, useEffect, useRef } from 'react';
import { Flame, Award, CheckCircle2, XCircle, ArrowRight, Zap, Lightbulb, Trophy, Check } from 'lucide-react';
import { QuizQuestion, ParticipantAnswer } from '../types';
import { sounds } from '../utils/audio';

interface QuizPlayerProps {
  questions: QuizQuestion[];
  initialQuestionIndex?: number;
  currentScore: number;
  currentStreak: number;
  onSubmitAnswer: (questionId: string, selectedIndex: number, timeTakenSec: number) => Promise<ParticipantAnswer | null>;
  onFinishQuiz: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  questions,
  initialQuestionIndex = 0,
  currentScore,
  currentStreak,
  onSubmitAnswer,
  onFinishQuiz
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submittedResult, setSubmittedResult] = useState<ParticipantAnswer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const startTimeRef = useRef<number>(Date.now());
  const currentQuestion = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex + 1 >= totalQuestions;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Reset answer states when active question index changes
  useEffect(() => {
    setIsAnswered(false);
    setSelectedOption(null);
    setSubmittedResult(null);
    setIsSubmitting(false);
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  const handleSelectOption = async (index: number) => {
    if (isAnswered || isSubmitting || !currentQuestion) return;

    setIsSubmitting(true);
    setSelectedOption(index);
    setIsAnswered(true);

    const timeTakenSec = Math.round(((Date.now() - startTimeRef.current) / 1000) * 10) / 10;
    
    // Audio feedback
    const isCorrect = index === currentQuestion.correctIndex;
    if (isCorrect) {
      sounds.playCorrect();
      if (currentStreak >= 1) {
        setTimeout(() => sounds.playStreak(), 280);
      }
    } else {
      sounds.playIncorrect();
    }

    try {
      const result = await onSubmitAnswer(currentQuestion.id, index, timeTakenSec);
      setSubmittedResult(result);
    } catch {
      // Graceful fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextOrFinish = () => {
    if (isLastQuestion) {
      onFinishQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Keyboard shortcut listener (1, 2, 3, 4, Space/Enter for Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAnswered && !isSubmitting && currentQuestion) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx < currentQuestion.options.length) {
            handleSelectOption(idx);
          }
        }
      } else if (isAnswered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleNextOrFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isSubmitting, currentQuestion, isLastQuestion]);

  if (!currentQuestion) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
        <button
          onClick={onFinishQuiz}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition"
        >
          View Final Leaderboard
        </button>
      </div>
    );
  }

  const optionColorStyles = [
    {
      base: 'border-indigo-200/90 bg-indigo-50/40 hover:bg-indigo-100/70 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 text-indigo-950 dark:text-indigo-100',
      badge: 'bg-indigo-600 text-white shadow-xs',
      letter: 'A'
    },
    {
      base: 'border-sky-200/90 bg-sky-50/40 hover:bg-sky-100/70 dark:border-sky-900/50 dark:bg-sky-950/30 dark:hover:bg-sky-900/50 text-sky-950 dark:text-sky-100',
      badge: 'bg-sky-600 text-white shadow-xs',
      letter: 'B'
    },
    {
      base: 'border-amber-200/90 bg-amber-50/40 hover:bg-amber-100/70 dark:border-amber-900/50 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-100',
      badge: 'bg-amber-600 text-white shadow-xs',
      letter: 'C'
    },
    {
      base: 'border-emerald-200/90 bg-emerald-50/40 hover:bg-emerald-100/70 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 text-emerald-950 dark:text-emerald-100',
      badge: 'bg-emerald-600 text-white shadow-xs',
      letter: 'D'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto flex flex-col justify-between space-y-6 transition-all duration-300">
      
      {/* Top HUD: Progress Bar, Score, Streak */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            {currentQuestion.category && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {currentQuestion.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            {currentStreak > 1 && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{currentStreak}x Streak</span>
              </div>
            )}

            {/* Total Score Pill */}
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-black text-[#4257B2] dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Award className="h-4 w-4 text-[#4257B2] dark:text-indigo-400" />
              <span>{currentScore.toLocaleString()} Pts</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4257B2] to-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        
        {/* Points Info Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#4257B2] dark:text-indigo-400">
            Multiple Choice
          </span>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            +{(currentQuestion.points || 1000).toLocaleString()} pts
          </div>
        </div>

        {/* Question Heading */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
          {currentQuestion.question}
        </h2>

        {/* 4-Choice Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {currentQuestion.options.map((opt, idx) => {
            const isCorrectAnswer = idx === currentQuestion.correctIndex;
            const isSelected = selectedOption === idx;
            const style = optionColorStyles[idx % optionColorStyles.length];

            let buttonStateClasses = style.base;

            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonStateClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-100 ring-2 ring-emerald-500 shadow-sm';
              } else if (isSelected && !isCorrectAnswer) {
                buttonStateClasses = 'border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/70 dark:text-rose-100 ring-2 ring-rose-500 shadow-sm';
              } else {
                buttonStateClasses = 'opacity-40 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered || isSubmitting}
                onClick={() => handleSelectOption(idx)}
                className={`group relative flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${buttonStateClasses}`}
              >
                {/* Choice Letter Tag */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition ${
                    isAnswered && isCorrectAnswer
                      ? 'bg-emerald-600 text-white'
                      : isAnswered && isSelected
                      ? 'bg-rose-600 text-white'
                      : style.badge
                  }`}
                >
                  {isAnswered && isCorrectAnswer ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isAnswered && isSelected && !isCorrectAnswer ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    style.letter
                  )}
                </div>

                {/* Option text */}
                <span className="flex-1 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {opt}
                </span>

                {/* Keyboard shortcut hint */}
                {!isAnswered && (
                  <span className="hidden sm:inline-block rounded border border-slate-300 bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    {idx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback / Explanation Box when answered */}
        {isAnswered && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 transition-all duration-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {selectedOption === currentQuestion.correctIndex ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                    <CheckCircle2 className="h-5 w-5" /> Correct Answer!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-black">
                    <XCircle className="h-5 w-5" />
                    Incorrect Answer!
                  </span>
                )}
              </div>

              {submittedResult && (
                <div className="flex items-center gap-1 text-xs font-black text-[#4257B2] dark:text-indigo-400">
                  <Zap className="h-4 w-4 fill-current" />
                  <span>+{submittedResult.scoreEarned.toLocaleString()} Points</span>
                </div>
              )}
            </div>

            {/* Explanation */}
            {currentQuestion.explanation && (
              <div className="flex items-start gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">Explanation: </strong>
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer / Next & Direct Leaderboard Button */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
          {isAnswered ? 'Press Enter or Space to continue' : 'Select an answer above'}
        </span>

        {isAnswered && (
          <button
            onClick={handleNextOrFinish}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg focus:outline-none focus:ring-4 active:scale-95 transition ${
              isLastQuestion
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 focus:ring-emerald-500/20'
                : 'bg-[#4257B2] hover:bg-[#344590] shadow-indigo-500/25 focus:ring-indigo-500/20'
            }`}
          >
            <span>{isLastQuestion ? 'Complete Quiz & See Leaderboard' : 'Next Question'}</span>
            {isLastQuestion ? <Trophy className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        )}
      </div>

    </div>
  );
};


