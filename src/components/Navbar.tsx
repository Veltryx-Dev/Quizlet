import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Share2, Sparkles, Trophy, LogOut, Check, Radio, Sun, Moon } from 'lucide-react';
import { sounds } from '../utils/audio';
import { getShareUrl } from '../utils/helpers';
import { applyTheme, getInitialTheme, ThemeMode } from '../utils/theme';

interface NavbarProps {
  roomCode?: string;
  roomStatus?: 'lobby' | 'in_progress' | 'ended';
  isHost?: boolean;
  participantName?: string;
  onOpenShareModal?: () => void;
  onExit?: () => void;
  onOpenLeaderboardModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  roomStatus,
  isHost,
  participantName,
  onOpenShareModal,
  onExit,
  onOpenLeaderboardModal
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const toggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  const handleCopyLink = () => {
    if (!roomCode) return;
    const url = getShareUrl(roomCode);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <img
            src="/quizlet-logo.svg"
            alt="Quizlet Logo"
            className="h-10 w-10 rounded-xl shadow-md shadow-indigo-500/20 object-contain"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-[#4257B2] dark:text-indigo-400">
                Quizlet
              </span>
              {roomCode && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Radio className="h-3 w-3 text-indigo-500 animate-pulse" />
                  PIN: {roomCode}
                </span>
              )}
            </div>
            {participantName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Playing as <span className="font-semibold text-slate-700 dark:text-slate-200">{participantName}</span>
                {isHost && <span className="ml-1 text-xs font-bold text-amber-600 dark:text-amber-400">(Host)</span>}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Share Room Button if in a room */}
          {roomCode && (
            <button
              onClick={onOpenShareModal || handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Room'}</span>
            </button>
          )}

          {/* Leaderboard shortcut */}
          {roomCode && onOpenLeaderboardModal && (
            <button
              onClick={onOpenLeaderboardModal}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60 transition"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Leaderboard</span>
            </button>
          )}

          {/* Exit Room button */}
          {roomCode && onExit && (
            <button
              onClick={onExit}
              title="Leave Room"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
