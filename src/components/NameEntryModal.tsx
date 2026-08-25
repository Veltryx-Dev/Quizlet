import React, { useState, useEffect } from 'react';
import { Play, Trophy, Users, ShieldAlert, ArrowRight, Sparkles, User, Hash, PlusCircle } from 'lucide-react';
import { getDeterministicColor, getInitials } from '../utils/helpers';
import { sounds } from '../utils/audio';

interface NameEntryModalProps {
  initialCode?: string;
  onJoinRoom: (code: string, name: string, avatar: string, color: string) => void;
  onGoToHost: (name: string) => void;
  onCreateQuiz?: (name: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
  onClearError?: () => void;
}

export const NameEntryModal: React.FC<NameEntryModalProps> = ({
  initialCode = '',
  onJoinRoom,
  onGoToHost,
  onCreateQuiz,
  isLoading = false,
  errorMessage = '',
  onClearError
}) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(initialCode);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (onClearError) onClearError();
    setLocalError('');

    if (!name.trim()) {
      setLocalError('Please enter your name to continue.');
      return;
    }

    if (!roomCode.trim()) {
      setLocalError('Please enter a 6-character Room Code or PIN.');
      return;
    }

    const trimmedName = name.trim();
    const assignedColor = getDeterministicColor(trimmedName);
    const assignedInitials = getInitials(trimmedName);

    sounds.playJoin();
    onJoinRoom(roomCode.trim().toUpperCase(), trimmedName, assignedInitials, assignedColor);
  };

  const handleHostClick = () => {
    if (onClearError) onClearError();
    setLocalError('');
    const hostName = name.trim() || 'Quiz Master';
    sounds.playJoin();
    onGoToHost(hostName);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
      
      {/* Background ambient accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        
        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/50">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src="/quizlet-logo.svg"
                alt="Quizlet Logo"
                className="h-14 w-14 rounded-2xl shadow-lg shadow-indigo-500/25 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Quizlet Live
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your name to join live sessions or create custom quizzes
            </p>
          </div>

          {/* Error Banner */}
          {(errorMessage || localError) && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
              <div className="flex-1">{errorMessage || localError}</div>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            
            {/* 1. Name Input */}
            <div>
              <label htmlFor="participant-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Your Name / Nickname <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="participant-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (localError) setLocalError('');
                    if (onClearError) onClearError();
                  }}
                  placeholder="Enter your name (e.g. Alex, Sam)..."
                  maxLength={25}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-12 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800 transition"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                  {name.length}/25
                </div>
              </div>
            </div>

            {/* 2. Room Code */}
            <div>
              <label htmlFor="room-code-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Room Code / Game PIN
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Hash className="h-4 w-4" />
                </div>
                <input
                  id="room-code-input"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. QZ-4821"
                  maxLength={10}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-3 text-sm font-black tracking-widest text-indigo-700 uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 transition"
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="space-y-3 pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.99] disabled:opacity-50 transition"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{isLoading ? 'Connecting to Room...' : 'Join Live Quiz'}</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Create Custom Quiz Direct Button */}
                <button
                  type="button"
                  onClick={() => {
                    const hostName = name.trim() || 'Quiz Master';
                    sounds.playJoin();
                    if (onCreateQuiz) {
                      onCreateQuiz(hostName);
                    } else {
                      onGoToHost(hostName);
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Custom Quiz</span>
                </button>

                {/* Host a Quiz Button */}
                <button
                  type="button"
                  onClick={handleHostClick}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>Host Studio</span>
                </button>
              </div>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
