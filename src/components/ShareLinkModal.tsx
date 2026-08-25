import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, QrCode, Sparkles, Users, Share2 } from 'lucide-react';
import { getShareUrl } from '../utils/helpers';

interface ShareLinkModalProps {
  roomCode: string;
  quizTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  roomCode,
  quizTitle,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = getShareUrl(roomCode);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  // Generate simple QR Code URL via standard high-availability qr image API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=FFFFFF&color=312E81&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-2">
            <Share2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Share Quiz Room
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {quizTitle}
          </p>
        </div>

        {/* Big Room Code Display */}
        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-center dark:border-indigo-900/40 dark:bg-indigo-950/40">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Room Code / PIN
          </span>
          <div className="mt-1 text-3xl font-black tracking-widest text-indigo-900 dark:text-indigo-200">
            {roomCode}
          </div>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1">
            Participants can enter this PIN on the homepage
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
            <img
              src={qrUrl}
              alt={`QR Code for Room ${roomCode}`}
              className="w-36 h-36 rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Direct Link Box */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Direct Participant Invite Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Button: Test in new tab */}
        <button
          onClick={handleOpenNewTab}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
        >
          <ExternalLink className="h-4 w-4 text-indigo-500" />
          <span>Open Participant Screen in New Tab</span>
        </button>

      </div>
    </div>
  );
};
