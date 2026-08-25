import confetti from 'canvas-confetti';
import { Participant, LeaderboardEntry, Room } from '../types';

export function calculateLeaderboard(participants: Record<string, Participant>, totalQuestions: number): LeaderboardEntry[] {
  const list = Object.values(participants).map((p) => {
    const answersList = Object.values(p.answers || {});
    const answeredCount = answersList.length;
    const correctCount = answersList.filter((a) => a.isCorrect).length;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const totalTimeSec = answersList.reduce((acc, a) => acc + (a.timeTakenSec || 0), 0);

    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      totalScore: p.totalScore,
      answeredCount,
      correctCount,
      totalQuestions,
      accuracy,
      isFinished: p.isFinished,
      currentStreak: p.currentStreak,
      highestStreak: p.highestStreak,
      totalTimeSec: Math.round(totalTimeSec * 10) / 10,
      rank: 0
    };
  });

  // Sort primarily by totalScore (descending), then by accuracy (descending), then by totalTimeSec (ascending)
  list.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.accuracy !== a.accuracy) {
      return b.accuracy - a.accuracy;
    }
    return a.totalTimeSec - b.totalTimeSec;
  });

  // Assign ranks
  return list.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

export function triggerVictoryConfetti() {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

export function getShareUrl(roomCode: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomCode);
  return url.toString();
}

export function getInitials(name: string): string {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().substring(0, 2).toUpperCase();
}

export const COLOR_OPTIONS = [
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Blue', value: '#3B82F6' },
];

export function getDeterministicColor(name: string): string {
  if (!name) return COLOR_OPTIONS[0].value;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_OPTIONS.length;
  return COLOR_OPTIONS[index].value;
}
