import React from 'react';
import { Users, Play, Copy, Share2, HelpCircle, Award, UserMinus, Check, ShieldCheck, User } from 'lucide-react';
import { Room, Participant } from '../types';
import { getShareUrl } from '../utils/helpers';
import { sounds } from '../utils/audio';

interface LobbyViewProps {
  room: Room;
  currentParticipantId?: string;
  isHost: boolean;
  onStartQuiz: () => void;
  onKickParticipant?: (id: string) => void;
  onOpenShareModal: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentParticipantId,
  isHost,
  onStartQuiz,
  onKickParticipant,
  onOpenShareModal
}) => {
  const [copied, setCopied] = React.useState(false);
  const participantsList: Participant[] = Object.values(room.participants || {});
  const totalQuestions = room.quiz.questions.length;
  const totalBasePoints = room.quiz.questions.reduce((sum, q) => sum + (q.points || 1000), 0);

  const handleCopyLink = () => {
    const url = getShareUrl(room.code);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    sounds.playCorrect();
    onStartQuiz();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner: Quiz Details & Live Room PIN */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Quiz metadata */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {room.quiz.category || 'General Quiz'}
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {room.mode === 'host_guided' ? 'Host-Guided Pace' : 'Self-Paced Mode'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {room.quiz.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {room.quiz.description}
            </p>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-indigo-500" />
                {totalQuestions} Questions
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" />
                Up to {totalBasePoints.toLocaleString()} Points
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Host: {room.hostName}
              </span>
            </div>
          </div>

          {/* Room PIN Card & Share */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="w-full sm:w-auto rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-4 text-center dark:border-indigo-800 dark:bg-indigo-950/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                JOIN PIN
              </span>
              <span className="text-3xl font-black tracking-widest text-indigo-900 dark:text-indigo-200">
                {room.code}
              </span>
            </div>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700 shadow-sm transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={onOpenShareModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
              >
                <Share2 className="h-4 w-4" />
                <span>Share & QR</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Lobby Participants Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Joined Participants ({participantsList.length})
            </h2>
          </div>

          {/* Host Start Button */}
          {isHost && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start Quiz Now</span>
            </button>
          )}
        </div>

        {/* Participant Avatars Grid */}
        {participantsList.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No participants joined yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Share the Room Code <strong className="text-indigo-600 dark:text-indigo-400">{room.code}</strong> or copy the invite link above so participants can join!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {participantsList.map((p) => {
              const isSelf = p.id === currentParticipantId;
              return (
                <div
                  key={p.id}
                  className={`group relative flex flex-col items-center p-3.5 rounded-xl border transition-all ${
                    isSelf
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {/* Kick button for host */}
                  {isHost && onKickParticipant && (
                    <button
                      onClick={() => onKickParticipant(p.id)}
                      title="Remove participant"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Clean Initial/Icon Avatar */}
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black shadow-xs mb-2 text-white"
                    style={{ backgroundColor: p.color || '#6366F1' }}
                  >
                    {p.avatar && p.avatar.length <= 3 ? p.avatar : <User className="h-5 w-5" />}
                  </div>

                  {/* Name */}
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">
                    {p.name}
                  </span>

                  {/* Badge */}
                  {isSelf && (
                    <span className="mt-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Participant Waiting Status Banner if not host */}
        {!isHost && (
          <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-center dark:border-indigo-950 dark:bg-indigo-950/30">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              Waiting for the host ({room.hostName}) to start the quiz...
            </div>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1">
              Get ready! Your speed and accuracy will determine your final leaderboard ranking.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
