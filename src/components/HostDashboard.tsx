import React, { useState } from 'react';
import { Sparkles, Plus, Play, Users, Share2, Copy, Trophy, Check, Radio, Trash2, Edit, Monitor, ChevronRight, ShieldCheck, ArrowRight } from 'lucide-react';
import { Quiz, Room, RoomMode, Participant } from '../types';
import { DEFAULT_QUIZZES } from '../data/defaultQuizzes';
import { getShareUrl, calculateLeaderboard } from '../utils/helpers';
import { sounds } from '../utils/audio';

interface HostDashboardProps {
  hostName: string;
  activeRoom: Room | null;
  savedQuizzes: Quiz[];
  onLaunchRoom: (quiz: Quiz, mode: RoomMode, allowLateJoin: boolean, showLeaderboard: boolean) => void;
  onOpenCreateQuizModal: () => void;
  onEditQuiz: (quiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  onStartActiveRoom: () => void;
  onNextQuestion: () => void;
  onEndActiveRoom: () => void;
  onKickParticipant: (participantId: string) => void;
  onOpenShareModal: () => void;
  onOpenLeaderboardView: () => void;
  onLeaveHostRoom: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  hostName,
  activeRoom,
  savedQuizzes,
  onLaunchRoom,
  onOpenCreateQuizModal,
  onEditQuiz,
  onDeleteQuiz,
  onStartActiveRoom,
  onNextQuestion,
  onEndActiveRoom,
  onKickParticipant,
  onOpenShareModal,
  onOpenLeaderboardView,
  onLeaveHostRoom
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(savedQuizzes[0]?.id || DEFAULT_QUIZZES[0].id);
  const [roomMode, setRoomMode] = useState<RoomMode>('self_paced');
  const [allowLateJoin, setAllowLateJoin] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const allQuizzes = [...savedQuizzes];
  const selectedQuiz = allQuizzes.find((q) => q.id === selectedQuizId) || allQuizzes[0];

  const handleCopyLink = () => {
    if (!activeRoom) return;
    const url = getShareUrl(activeRoom.code);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunch = () => {
    if (!selectedQuiz) return;
    sounds.playJoin();
    onLaunchRoom(selectedQuiz, roomMode, allowLateJoin, showLeaderboard);
  };

  // If host is inside an active room:
  if (activeRoom) {
    const participantsList: Participant[] = Object.values(activeRoom.participants || {});
    const totalQuestions = activeRoom.quiz.questions.length;
    const currentQIndex = activeRoom.currentQuestionIndex;
    const currentQ = activeRoom.quiz.questions[currentQIndex];
    const leaderboard = calculateLeaderboard(activeRoom.participants || {}, totalQuestions);

    // Count how many participants have answered the current question
    const answeredCount = participantsList.filter(
      (p) => currentQ && p.answers[currentQ.id] !== undefined
    ).length;

    return (
      <div className={`min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 ${isProjectorMode ? 'bg-slate-950 text-white min-h-screen' : ''}`}>
        
        {/* Active Room Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {activeRoom.quiz.title}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  activeRoom.status === 'lobby'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    : activeRoom.status === 'in_progress'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {activeRoom.status === 'lobby' ? 'Lobby (Waiting to Start)' : activeRoom.status === 'in_progress' ? 'Live In Progress' : 'Quiz Ended'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Host Control Room • Mode: {activeRoom.mode === 'host_guided' ? 'Host-Guided' : 'Self-Paced'}
              </p>
            </div>
          </div>

          {/* Room PIN & Share Actions */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-center dark:border-indigo-900 dark:bg-indigo-950/40">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                GAME PIN
              </span>
              <span className="text-2xl font-black tracking-widest text-indigo-900 dark:text-indigo-200">
                {activeRoom.code}
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              <Share2 className="h-4 w-4" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <Monitor className="h-4 w-4" />
              <span>{isProjectorMode ? 'Standard View' : 'Projector Mode'}</span>
            </button>
          </div>

        </div>

        {/* Live Host Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Main Live Status / Question view */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* If in Lobby */}
            {activeRoom.status === 'lobby' && (
              <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Users className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Waiting in Lobby ({participantsList.length} Connected)
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Share the link or PIN <strong className="text-indigo-600 dark:text-indigo-400">{activeRoom.code}</strong> with your players. When ready, click Start!
                </p>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      sounds.playCorrect();
                      onStartActiveRoom();
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    <span>Start Quiz for Everyone</span>
                  </button>
                </div>
              </div>
            )}

            {/* If In Progress */}
            {activeRoom.status === 'in_progress' && (
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
                
                {/* Host Guided Active Question Card */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Live Question {currentQIndex + 1} of {totalQuestions}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {currentQ?.question}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {answeredCount}/{participantsList.length}
                    </span>
                    <p className="text-[11px] font-semibold text-slate-400">
                      Answers Received
                    </p>
                  </div>
                </div>

                {/* Option Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ?.options.map((opt, i) => {
                    const isCorrect = i === currentQ.correctIndex;
                    return (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200'
                            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center rounded bg-white/80 dark:bg-slate-700 shadow-xs">
                            {['A', 'B', 'C', 'D'][i]}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isCorrect && (
                          <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white uppercase">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Host Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={onEndActiveRoom}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300 transition"
                  >
                    End Quiz Early
                  </button>

                  <div className="flex items-center gap-3">
                    {activeRoom.mode === 'host_guided' && (
                      <button
                        onClick={onNextQuestion}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
                      >
                        <span>{currentQIndex + 1 >= totalQuestions ? 'Finish Quiz' : 'Next Question'}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={onOpenLeaderboardView}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 transition"
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Live Leaderboard</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* If Ended */}
            {activeRoom.status === 'ended' && (
              <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center space-y-4">
                <Trophy className="h-12 w-12 text-amber-500 mx-auto" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Quiz Completed!
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  All participants can view their final scorecards and standings.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={onOpenLeaderboardView}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>View Grand Podium & Full Rankings</span>
                  </button>
                  <button
                    onClick={onLeaveHostRoom}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    Return to Host Studio
                  </button>
                </div>
              </div>
            )}

            {/* Live Leaderboard preview table */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Live Scoreboard ({participantsList.length} Players)
                  </h3>
                </div>
                <button
                  onClick={onOpenLeaderboardView}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Full Screen Standings →
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-400 w-5">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </span>
                      <span className="text-base">{entry.avatar}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{entry.name}</span>
                      {entry.isFinished && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-950">
                          Finished
                        </span>
                      )}
                    </div>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">
                      {entry.totalScore.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Col: Live Participants Manager & Kick controls */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Connected Players ({participantsList.length})
                </h3>
              </div>
            </div>

            {participantsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Waiting for players to enter PIN <strong className="text-indigo-600">{activeRoom.code}</strong>...
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {participantsList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/50 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black text-white"
                        style={{ backgroundColor: p.color || '#6366F1' }}
                      >
                        {p.avatar && p.avatar.length <= 3 ? p.avatar : p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Score: {p.totalScore.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onKickParticipant(p.id)}
                      title="Kick player"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onLeaveHostRoom}
                className="w-full text-center rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                Close / Exit Room Console
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // ================= HOST DASHBOARD: QUIZ SELECTOR & ROOM CREATOR =================
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Host Studio
            </span>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              Host: {hostName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Host & Launch Live Quizzes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose a quiz, configure game rules, and generate real-time join links for your players.
          </p>
        </div>

        {/* Quick Quiz Creation Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateQuizModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Custom Quiz</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Quiz Selection & Room Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Quiz Library */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              1. Select a Quiz to Host ({allQuizzes.length})
            </h2>
            <span className="text-xs text-slate-400">
              Click a quiz card to select
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allQuizzes.length === 0 ? (
              <div className="col-span-2 text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Quizzes Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create your first custom quiz with 4 multiple choice options and set the correct answers!
                </p>
                <button
                  type="button"
                  onClick={onOpenCreateQuizModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create My Own Quiz</span>
                </button>
              </div>
            ) : (
              allQuizzes.map((quiz) => {
                const isSelected = quiz.id === selectedQuizId;

                return (
                  <div
                    key={quiz.id}
                    onClick={() => setSelectedQuizId(quiz.id)}
                    className={`group relative flex flex-col justify-between p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20 dark:bg-indigo-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {quiz.category || 'Custom'}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-black text-white">
                            <Check className="h-3 w-3" /> Selected
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {quiz.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{quiz.questions.length} Questions (4 Choices)</span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditQuiz(quiz);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                          title="Edit Quiz"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="text-[11px]">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteQuiz(quiz.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          title="Delete Quiz"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="text-[11px]">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Host Configuration & Launch Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6 sticky top-24">
            
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                2. Game Room Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure pacing and participant rules
              </p>
            </div>

            {/* Pacing Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pacing Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoomMode('self_paced')}
                  className={`p-3 rounded-xl border text-left transition ${
                    roomMode === 'self_paced'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-black block text-slate-900 dark:text-white">⚡ Self-Paced</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Players answer at their own speed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRoomMode('host_guided')}
                  className={`p-3 rounded-xl border text-left transition ${
                    roomMode === 'host_guided'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-black block text-slate-900 dark:text-white">🎯 Host-Guided</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Host controls question pacing</span>
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Allow late joins after start
                </span>
                <input
                  type="checkbox"
                  checked={allowLateJoin}
                  onChange={(e) => setAllowLateJoin(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Show live leaderboard sync
                </span>
                <input
                  type="checkbox"
                  checked={showLeaderboard}
                  onChange={(e) => setShowLeaderboard(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>
            </div>

            {/* Selected Quiz Summary Card */}
            {selectedQuiz && (
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
                  Ready to Host: {selectedQuiz.title}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                  {selectedQuiz.questions.length} questions • ~{selectedQuiz.questions.reduce((acc, q) => acc + (q.timeLimit || 20), 0)}s duration
                </span>
              </div>
            )}

            {/* Launch Button */}
            <button
              type="button"
              onClick={handleLaunch}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] transition"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Launch Live Quiz Room</span>
              <ArrowRight className="h-5 w-5 ml-1" />
            </button>

          </div>
        </div>

      </div>

    </div>
  );
};
