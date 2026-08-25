import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Copy, Clock, Award, HelpCircle, Save, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Quiz, QuizQuestion } from '../types';

interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuiz: (quiz: Quiz) => void;
  initialQuiz?: Quiz | null;
}

const OPTION_STYLES = [
  {
    letter: 'A',
    symbol: '▲',
    label: 'Option A (Red)',
    borderActive: 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 ring-2 ring-rose-500/30',
    borderIdle: 'border-slate-200 hover:border-rose-300 dark:border-slate-800 dark:hover:border-rose-900/60',
    badgeActive: 'bg-rose-600 text-white shadow-sm',
    badgeIdle: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    btnActive: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
    btnIdle: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
  },
  {
    letter: 'B',
    symbol: '◆',
    label: 'Option B (Blue)',
    borderActive: 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/30',
    borderIdle: 'border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-900/60',
    badgeActive: 'bg-blue-600 text-white shadow-sm',
    badgeIdle: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    btnActive: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
    btnIdle: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
  },
  {
    letter: 'C',
    symbol: '●',
    label: 'Option C (Yellow)',
    borderActive: 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/30',
    borderIdle: 'border-slate-200 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-900/60',
    badgeActive: 'bg-amber-500 text-white shadow-sm',
    badgeIdle: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    btnActive: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
    btnIdle: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
  },
  {
    letter: 'D',
    symbol: '■',
    label: 'Option D (Green)',
    borderActive: 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30',
    borderIdle: 'border-slate-200 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-900/60',
    badgeActive: 'bg-emerald-600 text-white shadow-sm',
    badgeIdle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    btnActive: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
    btnIdle: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
  }
];

export const QuizBuilderModal: React.FC<QuizBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveQuiz,
  initialQuiz
}) => {
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [category, setCategory] = useState(initialQuiz?.category || 'General Knowledge');
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuiz?.questions || [
      {
        id: 'q1',
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        timeLimit: 20,
        points: 1000,
        explanation: '',
        category: 'General'
      }
    ]
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        timeLimit: 20,
        points: 1000,
        explanation: '',
        category
      }
    ]);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const original = questions[idx];
    const duplicated: QuizQuestion = {
      ...original,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      options: [...original.options]
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, duplicated);
    setQuestions(updated);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      setError('Your quiz must have at least 1 question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIdx].options];
    newOptions[optIdx] = val;
    updated[qIdx] = { ...updated[qIdx], options: newOptions };
    setQuestions(updated);
  };

  const handleSetCorrectIndex = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], correctIndex: optIdx };
    setQuestions(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a title for your custom quiz.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question #${i + 1} needs a question prompt.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          setError(`Question #${i + 1} is missing Option ${['A', 'B', 'C', 'D'][j]}. Please fill all 4 options.`);
          return;
        }
      }
      if (q.correctIndex === undefined || q.correctIndex < 0 || q.correctIndex > 3) {
        setError(`Please select the correct answer (A, B, C, or D) for Question #${i + 1}.`);
        return;
      }
    }

    const newQuiz: Quiz = {
      id: initialQuiz?.id || `quiz-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom created quiz',
      category: category.trim() || 'Custom',
      questions,
      createdAt: Date.now()
    };

    onSaveQuiz(newQuiz);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[94vh] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {initialQuiz ? 'Edit Custom Quiz' : 'Create Custom Quiz'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Write questions, fill in 4 answer choices, and click the button to set the correct answer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Quiz Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Quiz Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Awesome Anime & Gaming Trivia"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Gaming, Trivia, Friends"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description for your players"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Questions Header */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Quiz Questions ({questions.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add 4 answer options for each question and choose the winning correct answer.
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:text-indigo-300 dark:hover:bg-indigo-900 transition"
              >
                <Plus className="h-4 w-4" /> Add New Question
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((q, qIdx) => {
                const activeCorrect = q.correctIndex;
                const correctLetter = ['A', 'B', 'C', 'D'][activeCorrect] || 'A';

                return (
                  <div
                    key={q.id || qIdx}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800/90 space-y-4 transition"
                  >
                    {/* Question Title Bar */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
                          {qIdx + 1}
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Question #{qIdx + 1}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          Correct Answer: Option {correctLetter}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(qIdx)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          title="Duplicate Question"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Duplicate</span>
                        </button>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="Delete Question"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Prompt Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Question Prompt <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                        placeholder={`e.g. What is the capital of Japan?`}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    {/* 4 Answer Choice Buttons & Inputs */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>4 Answer Options & Correct Selection:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 text-[11px]">
                          👉 Click "✅ Correct Answer" on the right option
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[0, 1, 2, 3].map((optIdx) => {
                          const style = OPTION_STYLES[optIdx];
                          const isCorrect = q.correctIndex === optIdx;
                          const optValue = q.options[optIdx] || '';

                          return (
                            <div
                              key={optIdx}
                              className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20 dark:bg-emerald-950/40 dark:border-emerald-500'
                                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                {/* Option Letter/Symbol Badge */}
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition ${
                                    isCorrect ? 'bg-emerald-600 text-white' : style.badgeIdle
                                  }`}
                                >
                                  {style.letter}
                                </div>

                                {/* Option Text Input */}
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={optValue}
                                    onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                    placeholder={`Type Option ${style.letter} answer...`}
                                    required
                                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                                  />
                                </div>
                              </div>

                              {/* 4 BUTTON CHOICE FOR CORRECT SELECTION */}
                              <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  {isCorrect ? '🌟 This is the winning answer' : 'Incorrect choice'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleSetCorrectIndex(qIdx, optIdx)}
                                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30 hover:bg-emerald-700'
                                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {isCorrect ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                      <span>✅ Correct Answer</span>
                                    </>
                                  ) : (
                                    <span>Set as Correct</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Question Meta: Explanation */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          Explanation / Fun Fact (Optional)
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                          placeholder="Show players why this answer is correct after they submit their choice"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Bottom Add Question Button */}
            <div className="text-center py-2">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 px-6 py-3 text-xs font-bold text-indigo-600 hover:bg-indigo-100 hover:border-indigo-400 dark:border-indigo-900/80 dark:bg-indigo-950/30 dark:text-indigo-300 transition"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Another Question</span>
              </button>
            </div>

          </div>

          {/* Footer Save & Cancel */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/70">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-violet-700 transition"
            >
              <Save className="h-4 w-4" />
              <span>Save & Launch Quiz</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
