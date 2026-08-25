import React from 'react';
import { X, CheckCircle2, XCircle, Clock, Zap, Lightbulb, BookOpen } from 'lucide-react';
import { QuizQuestion, ParticipantAnswer } from '../types';

interface QuestionReviewModalProps {
  questions: QuizQuestion[];
  answers: Record<string, ParticipantAnswer>;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionReviewModal: React.FC<QuestionReviewModalProps> = ({
  questions,
  answers,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Question Review & Solutions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed breakdown of your answers and explanations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const isAnswered = ans !== undefined;
            const isCorrect = isAnswered && ans.isCorrect;
            const selectedIdx = isAnswered ? ans.selectedIndex : -1;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-3"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Question {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {q.question}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct (+{ans.scoreEarned})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        <XCircle className="h-3.5 w-3.5" /> {selectedIdx === -1 ? 'Skipped / Timed Out' : 'Incorrect'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isTheCorrectOption = optIdx === q.correctIndex;
                    const isUserSelected = optIdx === selectedIdx;

                    let optClass = 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
                    if (isTheCorrectOption) {
                      optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold dark:bg-emerald-950/70 dark:text-emerald-200 ring-1 ring-emerald-500';
                    } else if (isUserSelected && !isTheCorrectOption) {
                      optClass = 'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200 line-through opacity-80';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${optClass}`}
                      >
                        <span className="font-bold shrink-0">
                          {['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isTheCorrectOption && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                        {isUserSelected && !isTheCorrectOption && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="flex items-start gap-2 pt-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">Explanation: </strong>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition"
          >
            Close Review
          </button>
        </div>

      </div>
    </div>
  );
};
