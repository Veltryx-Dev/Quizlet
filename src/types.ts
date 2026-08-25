export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number; // in seconds (e.g. 10, 15, 20, 30)
  points: number; // base points (e.g. 1000)
  explanation?: string;
  category?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  timeLimitPerQuestion?: number;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface ParticipantAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  timeTakenSec: number;
  scoreEarned: number;
  streakAtAnswer: number;
  answeredAt: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  joinedAt: number;
  answers: Record<string, ParticipantAnswer>;
  currentQuestionIndex: number;
  totalScore: number;
  currentStreak: number;
  highestStreak: number;
  isFinished: boolean;
  finishedAt?: number;
  lastActive: number;
}

export type RoomStatus = 'lobby' | 'in_progress' | 'ended';
export type RoomMode = 'self_paced' | 'host_guided';

export interface Room {
  code: string;
  hostId: string;
  hostName: string;
  quiz: Quiz;
  status: RoomStatus;
  currentQuestionIndex: number;
  mode: RoomMode;
  createdAt: number;
  participants: Record<string, Participant>;
  allowLateJoin: boolean;
  showLeaderboardAfterEach: boolean;
  questionStartTime?: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  color: string;
  totalScore: number;
  answeredCount: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  isFinished: boolean;
  currentStreak: number;
  highestStreak: number;
  totalTimeSec: number;
  rank: number;
}
