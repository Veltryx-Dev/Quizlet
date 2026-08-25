import React, { useEffect } from 'react';
import { Trophy, Medal, Flame, Clock, CheckCircle2, Share2, RotateCcw, BookOpen, Sparkles, ArrowRight, ShieldCheck, User, Crown } from 'lucide-react';
import { Room, LeaderboardEntry } from '../types';
import { calculateLeaderboard, triggerVictoryConfetti, getShareUrl } from '../utils/helpers';
import { sounds } from '../utils/audio';

interface LeaderboardViewProps {
  room: Room;
  currentParticipantId?: string;
  onOpenReviewModal: () => void;
  onOpenShareModal: () => void;
  onPlayAgain?: () => void;
  onReturnHome?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  room,
  currentParticipantId,
  onOpenReviewModal,
  onOpenShareModal,
  onPlayAgain,
  onReturnHome
}) => {
  const totalQuestions = room.quiz.questions.length;
  const leaderboard: LeaderboardEntry[] = calculateLeaderboard(room.participants || {}, totalQuestions);
  
  const currentUserEntry = leaderboard.find((e) => e.id === currentParticipantId);

  useEffect(() => {
    // If current user is in top 3 or finished, play victory fanfare & trigger confetti
    if (currentUserEntry?.isFinished) {
      sounds.playVictory();
      triggerVictoryConfetti();
    }
  }, [currentUserEntry?.isFinished]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Trophy className="h-4 w-4" />
          <span>Final Standings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Quiz Leaderboard & Results
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {room.quiz.title} • PIN: <strong className="text-indigo-600 dark:text-indigo-400">{room.code}</strong>
        </p>
      </div>

      {/* Current User Scorecard Highlight */}
      {currentUserEntry && (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-white p-5 shadow-sm dark:border-indigo-500/30 dark:to-slate-900">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            
            {/* User Identity & Rank */}
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-xs"
                style={{ backgroundColor: currentUserEntry.color || '#6366F1' }}
              >
                {currentUserEntry.avatar && currentUserEntry.avatar.length <= 3 ? currentUserEntry.avatar : <User className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {currentUserEntry.name}
                  </span>
                  <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                    You
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Rank #{currentUserEntry.rank} of {leaderboard.length}</span>
                  {currentUserEntry.rank === 1 && <span className="text-emerald-600 dark:text-emerald-400 font-bold">• 1st Place Champion!</span>}
                  {currentUserEntry.rank === 2 && <span className="text-slate-600 dark:text-slate-300 font-bold">• 2nd Place</span>}
                  {currentUserEntry.rank === 3 && <span className="text-amber-600 dark:text-amber-400 font-bold">• 3rd Place</span>}
                </div>
              </div>
            </div>

            {/* Score Stats Grid */}
            <div className="grid grid-cols-3 gap-3 text-center w-full sm:w-auto">
              <div className="rounded-xl bg-white/80 p-2.5 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 min-w-[80px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</span>
                <p className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {currentUserEntry.totalScore.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-white/80 p-2.5 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 min-w-[80px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accuracy</span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {currentUserEntry.correctCount}/{totalQuestions} ({currentUserEntry.accuracy}%)
                </p>
              </div>

              <div className="rounded-xl bg-white/80 p-2.5 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 min-w-[80px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Streak</span>
                <p className="text-base font-black text-amber-600 dark:text-amber-400">
                  {currentUserEntry.highestStreak}x
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Top 3 Podium (Visual) */}
      {leaderboard.length > 0 && (
        <div className="pt-4 pb-2">
          <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-xl mx-auto">
            
            {/* 2nd Place */}
            {top2 ? (
              <div className="flex-1 flex flex-col items-center">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black text-white shadow-xs mb-1.5"
                  style={{ backgroundColor: top2.color || '#6366F1' }}
                >
                  {top2.avatar && top2.avatar.length <= 3 ? top2.avatar : <User className="h-5 w-5" />}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px] text-center">
                  {top2.name}
                </span>
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  {top2.totalScore.toLocaleString()} pts
                </span>
                <div className="w-full mt-2 h-20 sm:h-24 rounded-t-xl bg-slate-200 dark:bg-slate-800 flex flex-col items-center justify-center border-t-2 border-slate-400">
                  <Medal className="h-5 w-5 text-slate-500 dark:text-slate-400 mb-1" />
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">2nd Place</span>
                </div>
              </div>
            ) : <div className="flex-1" />}

            {/* 1st Place (Center / Tallest) */}
            {top1 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="relative">
                  <Crown className="h-5 w-5 text-amber-500 mx-auto mb-1 animate-bounce" />
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-sm font-black text-white shadow-md mb-1.5 ring-2 ring-amber-400"
                    style={{ backgroundColor: top1.color || '#6366F1' }}
                  >
                    {top1.avatar && top1.avatar.length <= 3 ? top1.avatar : <User className="h-6 w-6" />}
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-[120px] text-center">
                  {top1.name}
                </span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                  {top1.totalScore.toLocaleString()} pts
                </span>
                <div className="w-full mt-2 h-28 sm:h-32 rounded-t-xl bg-amber-100 dark:bg-amber-950/60 flex flex-col items-center justify-center border-t-2 border-amber-400 shadow-sm">
                  <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-1" />
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200">1st Place</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 ? (
              <div className="flex-1 flex flex-col items-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white shadow-xs mb-1.5"
                  style={{ backgroundColor: top3.color || '#6366F1' }}
                >
                  {top3.avatar && top3.avatar.length <= 3 ? top3.avatar : <User className="h-5 w-5" />}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px] text-center">
                  {top3.name}
                </span>
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  {top3.totalScore.toLocaleString()} pts
                </span>
                <div className="w-full mt-2 h-16 sm:h-18 rounded-t-xl bg-amber-50 dark:bg-amber-950/30 flex flex-col items-center justify-center border-t-2 border-amber-600">
                  <Medal className="h-4 w-4 text-amber-700 dark:text-amber-500 mb-0.5" />
                  <span className="text-xs font-black text-amber-900 dark:text-amber-300">3rd Place</span>
                </div>
              </div>
            ) : <div className="flex-1" />}

          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Full Standings ({leaderboard.length} Participants)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Live Synchronized Rankings
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {leaderboard.map((entry) => {
            const isSelf = entry.id === currentParticipantId;
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3.5 transition ${
                  isSelf
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Rank & Participant */}
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center font-bold text-xs text-slate-500 dark:text-slate-400">
                    #{entry.rank}
                  </div>

                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-xs"
                    style={{ backgroundColor: entry.color || '#6366F1' }}
                  >
                    {entry.avatar && entry.avatar.length <= 3 ? entry.avatar : <User className="h-4 w-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {entry.name}
                      </span>
                      {isSelf && (
                        <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{entry.correctCount}/{totalQuestions} correct</span>
                      <span>•</span>
                      <span>{entry.totalTimeSec}s</span>
                      {entry.isFinished && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Finished</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    {entry.totalScore.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">points</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={onOpenReviewModal}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
        >
          <BookOpen className="h-4 w-4 text-indigo-500" />
          <span>Review Questions & Solutions</span>
        </button>

        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 transition"
        >
          <Share2 className="h-4 w-4" />
          <span>Share Room PIN</span>
        </button>

        {onReturnHome && (
          <button
            onClick={onReturnHome}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
          >
            <span>Back to Home</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

    </div>
  );
};
