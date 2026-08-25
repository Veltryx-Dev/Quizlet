import { Room, Participant, Quiz, ParticipantAnswer, RoomMode } from '../types';
import { DEFAULT_QUIZZES } from '../data/defaultQuizzes';

const ROOMS_KEY = 'quizlet_local_rooms';
const CHANNEL_NAME = 'quizlet_room_sync';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch {}
}

export function getLocalRooms(): Record<string, Room> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveLocalRooms(rooms: Record<string, Room>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ROOMS_SYNC', timestamp: Date.now() });
    }
  } catch {}
}

export function subscribeToLocalRoom(roomCode: string, onUpdate: (room: Room) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'ROOMS_SYNC') {
      const rooms = getLocalRooms();
      const target = rooms[roomCode.toUpperCase()];
      if (target) onUpdate(target);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === ROOMS_KEY) {
      const rooms = getLocalRooms();
      const target = rooms[roomCode.toUpperCase()];
      if (target) onUpdate(target);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);

  // Poll fallback every 1.5s
  const interval = window.setInterval(() => {
    const rooms = getLocalRooms();
    const target = rooms[roomCode.toUpperCase()];
    if (target) onUpdate(target);
  }, 1500);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
    clearInterval(interval);
  };
}

export function createLocalRoom(
  hostName: string,
  quiz: Quiz,
  mode: RoomMode = 'self_paced',
  allowLateJoin: boolean = true,
  showLeaderboardAfterEach: boolean = true
): { room: Room; code: string; hostId: string } {
  const code = 'QZ-' + Math.floor(1000 + Math.random() * 9000);
  const hostId = 'host_' + Math.random().toString(36).substring(2, 9);

  const room: Room = {
    code,
    hostId,
    hostName: hostName || 'Quiz Master',
    quiz,
    mode,
    status: 'lobby',
    currentQuestionIndex: 0,
    participants: {},
    createdAt: Date.now(),
    allowLateJoin,
    showLeaderboardAfterEach
  };

  const rooms = getLocalRooms();
  rooms[code] = room;
  saveLocalRooms(rooms);

  return { room, code, hostId };
}

export function joinLocalRoom(
  code: string,
  name: string,
  avatar: string,
  color: string
): { participant: Participant; room: Room } {
  const upperCode = code.toUpperCase();
  const rooms = getLocalRooms();
  let room = rooms[upperCode];

  // If room doesn't exist locally, create a default room on the fly so Vercel users can play immediately
  if (!room) {
    const defaultQuiz = DEFAULT_QUIZZES[0];
    const created = createLocalRoom('Host', defaultQuiz);
    room = created.room;
    room.code = upperCode;
    rooms[upperCode] = room;
  }

  const participantId = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const participant: Participant = {
    id: participantId,
    name: name || 'Player',
    avatar: avatar || 'P',
    color: color || '#6366F1',
    joinedAt: Date.now(),
    currentQuestionIndex: 0,
    totalScore: 0,
    currentStreak: 0,
    highestStreak: 0,
    answers: {},
    isFinished: false,
    lastActive: Date.now()
  };

  if (!room.participants) room.participants = {};
  room.participants[participantId] = participant;
  rooms[upperCode] = room;
  saveLocalRooms(rooms);

  return { participant, room };
}

export function submitLocalAnswer(
  code: string,
  participantId: string,
  questionId: string,
  selectedIndex: number,
  timeTakenSec: number
): { answer: ParticipantAnswer; room: Room } | null {
  const upperCode = code.toUpperCase();
  const rooms = getLocalRooms();
  const room = rooms[upperCode];
  if (!room || !room.participants || !room.participants[participantId]) return null;

  const participant = room.participants[participantId];
  const question = room.quiz.questions.find((q) => q.id === questionId);
  if (!question) return null;

  const isCorrect = selectedIndex === question.correctIndex;
  const basePoints = question.points || 1000;
  
  // Clean points without timer pressure
  let scoreEarned = 0;
  if (isCorrect) {
    participant.currentStreak = (participant.currentStreak || 0) + 1;
    if (participant.currentStreak > (participant.highestStreak || 0)) {
      participant.highestStreak = participant.currentStreak;
    }
    const streakBonus = Math.min((participant.currentStreak - 1) * 100, 500);
    scoreEarned = basePoints + streakBonus;
  } else {
    participant.currentStreak = 0;
  }

  participant.totalScore = (participant.totalScore || 0) + scoreEarned;
  participant.lastActive = Date.now();

  const answer: ParticipantAnswer = {
    questionId,
    selectedIndex,
    isCorrect,
    scoreEarned,
    streakAtAnswer: participant.currentStreak,
    timeTakenSec: timeTakenSec || 0,
    answeredAt: Date.now()
  };

  if (!participant.answers) participant.answers = {};
  participant.answers[questionId] = answer;

  const answeredCount = Object.keys(participant.answers).length;
  if (answeredCount >= room.quiz.questions.length) {
    participant.isFinished = true;
  }

  rooms[upperCode] = room;
  saveLocalRooms(rooms);

  return { answer, room };
}

export function startLocalRoom(code: string): Room | null {
  const upperCode = code.toUpperCase();
  const rooms = getLocalRooms();
  const room = rooms[upperCode];
  if (!room) return null;

  room.status = 'in_progress';
  room.currentQuestionIndex = 0;
  rooms[upperCode] = room;
  saveLocalRooms(rooms);
  return room;
}

export function nextQuestionLocalRoom(code: string): Room | null {
  const upperCode = code.toUpperCase();
  const rooms = getLocalRooms();
  const room = rooms[upperCode];
  if (!room) return null;

  room.currentQuestionIndex += 1;
  if (room.currentQuestionIndex >= room.quiz.questions.length) {
    room.status = 'ended';
  }
  rooms[upperCode] = room;
  saveLocalRooms(rooms);
  return room;
}

export function endLocalRoom(code: string): Room | null {
  const upperCode = code.toUpperCase();
  const rooms = getLocalRooms();
  const room = rooms[upperCode];
  if (!room) return null;

  room.status = 'ended';
  rooms[upperCode] = room;
  saveLocalRooms(rooms);
  return room;
}

export function kickLocalParticipant(code: string, participantId: string): Room | null {
  const upperCode = code.toUpperCase();
  const rooms = getLocalRooms();
  const room = rooms[upperCode];
  if (!room || !room.participants) return null;

  delete room.participants[participantId];
  rooms[upperCode] = room;
  saveLocalRooms(rooms);
  return room;
}

export function finishLocalParticipant(code: string, participantId: string): Room | null {
  const upperCode = code.toUpperCase();
  const rooms = getLocalRooms();
  const room = rooms[upperCode];
  if (!room || !room.participants || !room.participants[participantId]) return null;

  room.participants[participantId].isFinished = true;
  rooms[upperCode] = room;
  saveLocalRooms(rooms);
  return room;
}
