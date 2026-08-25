import React, { useState, useEffect, useRef } from 'react';
import { Clock, Flame, Award, CheckCircle2, XCircle, ArrowRight, Zap, Lightbulb } from 'lucide-react';
import { QuizQuestion, ParticipantAnswer } from '../types';
import { sounds } from '../utils/audio';

interface QuizPlayerProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  currentScore: number;
  currentStreak: number;
  onSubmitAnswer: (questionId: string, selectedIndex: number, timeTakenSec: number) => Promise<ParticipantAnswer | null>;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  question,
  questionIndex,
  totalQuestions,
  currentScore,
  currentStreak,
  onSubmitAnswer,
  onNextQuestion,
  isLastQuestion
}) => {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit || 20);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submittedResult, setSubmittedResult] = useState<ParticipantAnswer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  const totalTime = question.timeLimit || 20;
  const progressPercent = Math.round(((questionIndex + 1) / totalQuestions) * 100);
  const timePercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  // Reset states when question changes
  useEffect(() => {
    setTimeLeft(question.timeLimit || 20);
    setIsAnswered(false);
    setSelectedOption(null);
    setSubmittedResult(null);
    setIsSubmitting(false);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 5) {
          sounds.playUrgentTick();
        } else {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question.id]);

  // Handle timeout (auto submit no answer)
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered && !isSubmitting) {
      handleSelectOption(-1);
    }
  }, [timeLeft, isAnswered, isSubmitting]);

  const handleSelectOption = async (index: number) => {
    if (isAnswered || isSubmitting) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);
    setSelectedOption(index);
    setIsAnswered(true);

    const timeTakenSec = Math.round(((Date.now() - startTimeRef.current) / 1000) * 10) / 10;
    
    // Play local audio feedback immediately
    const isCorrect = index === question.correctIndex;
    if (isCorrect) {
      sounds.playCorrect();
      if (currentStreak >= 1) {
        setTimeout(() => sounds.playStreak(), 300);
      }
    } else {
      sounds.playIncorrect();
    }

    try {
      const result = await onSubmitAnswer(question.id, index, timeTakenSec);
      setSubmittedResult(result);
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut listener (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered || isSubmitting) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < question.options.length) {
          handleSelectOption(idx);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isSubmitting, question.options.length]);

  const optionColorStyles = [
    {
      base: 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60',
      badge: 'bg-indigo-600 text-white',
      ring: 'focus:ring-indigo-500'
    },
    {
      base: 'border-pink-200 bg-pink-50/50 hover:bg-pink-100/70 dark:border-pink-900/60 dark:bg-pink-950/40 dark:hover:bg-pink-900/60',
      badge: 'bg-pink-600 text-white',
      ring: 'focus:ring-pink-500'
    },
    {
      base: 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 dark:border-amber-900/60 dark:bg-amber-950/40 dark:hover:bg-amber-900/60',
      badge: 'bg-amber-600 text-white',
      ring: 'focus:ring-amber-500'
    },
    {
      base: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60',
      badge: 'bg-emerald-600 text-white',
      ring: 'focus:ring-emerald-500'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto flex flex-col justify-between space-y-6">
      
      {/* Top HUD: Progress Bar, Score, Streak */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            {question.category && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {question.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            {currentStreak > 1 && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{currentStreak}x Streak</span>
              </div>
            )}

            {/* Total Score Pill */}
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{currentScore.toLocaleString()} Pts</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        
        {/* Timer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${timeLeft <= 5 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
            <span className={`text-base font-black tracking-tight ${timeLeft <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {timeLeft}s remaining
            </span>
          </div>

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Up to +{(question.points || 1000).toLocaleString()} pts
          </div>
        </div>

        {/* Linear Timer Indicator */}
        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>

        {/* Question Heading */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
          {question.question}
        </h2>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {question.options.map((opt, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`;
            const isCorrectAnswer = idx === question.correctIndex;
            const isSelected = selectedOption === idx;
            const style = optionColorStyles[idx % optionColorStyles.length];

            let buttonStateClasses = style.base;

            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonStateClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-100 ring-2 ring-emerald-500';
              } else if (isSelected && !isCorrectAnswer) {
                buttonStateClasses = 'border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/70 dark:text-rose-100 ring-2 ring-rose-500';
              } else {
                buttonStateClasses = 'opacity-50 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900';
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
                    letter
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
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 animate-fadeIn space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {selectedOption === question.correctIndex ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" /> Correct!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <XCircle className="h-5 w-5" />
                    {selectedOption === -1 ? 'Time Expired!' : 'Incorrect!'}
                  </span>
                )}
              </div>

              {submittedResult && (
                <div className="flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400">
                  <Zap className="h-4 w-4 fill-current" />
                  <span>+{submittedResult.scoreEarned.toLocaleString()} Points</span>
                </div>
              )}
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div className="flex items-start gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">Explanation: </strong>
                  {question.explanation}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer / Next Button */}
      <div className="flex items-center justify-end pt-2">
        {isAnswered && (
          <button
            onClick={onNextQuestion}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:scale-95 transition"
          >
            <span>{isLastQuestion ? 'View Final Results & Leaderboard' : 'Next Question'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

    </div>
  );
};
