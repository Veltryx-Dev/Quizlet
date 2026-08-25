import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Room, Participant, Quiz, ParticipantAnswer } from './src/types';
import { DEFAULT_QUIZZES } from './src/data/defaultQuizzes';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// In-memory store for active quiz rooms
const rooms = new Map<string, Room>();

// SSE client connections: code -> Set of Response objects
const sseClients = new Map<string, Set<express.Response>>();

function broadcastRoomUpdate(code: string) {
  const room = rooms.get(code);
  if (!room) return;

  const clients = sseClients.get(code);
  if (clients && clients.size > 0) {
    const data = JSON.stringify({ type: 'ROOM_UPDATE', room });
    for (const client of clients) {
      try {
        client.write(`data: ${data}\n\n`);
      } catch {
        clients.delete(client);
      }
    }
  }
}

// Helper to generate a 6-digit or friendly code
function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

// Seed a default demo room on startup so users can jump right in if desired
function seedDemoRoom() {
  const demoCode = 'DEMO10';
  const defaultQuiz = DEFAULT_QUIZZES[0];
  const demoRoom: Room = {
    code: demoCode,
    hostId: 'host-demo',
    hostName: 'Veltryx Host',
    quiz: defaultQuiz,
    status: 'lobby',
    currentQuestionIndex: 0,
    mode: 'self_paced',
    createdAt: Date.now(),
    participants: {
      'bot-1': {
        id: 'bot-1',
        name: 'CyberNinja',
        avatar: '🥷',
        color: '#6366F1',
        joinedAt: Date.now() - 60000,
        answers: {},
        currentQuestionIndex: 0,
        totalScore: 0,
        currentStreak: 0,
        highestStreak: 0,
        isFinished: false,
        lastActive: Date.now()
      },
      'bot-2': {
        id: 'bot-2',
        name: 'PixelQueen',
        avatar: '👑',
        color: '#EC4899',
        joinedAt: Date.now() - 40000,
        answers: {},
        currentQuestionIndex: 0,
        totalScore: 0,
        currentStreak: 0,
        highestStreak: 0,
        isFinished: false,
        lastActive: Date.now()
      }
    },
    allowLateJoin: true,
    showLeaderboardAfterEach: true,
  };
  rooms.set(demoCode, demoRoom);
}
seedDemoRoom();

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

// Get preset quizzes
app.get('/api/quizzes/presets', (req, res) => {
  res.json({ presets: DEFAULT_QUIZZES });
});

// Create Room
app.post('/api/rooms', (req, res) => {
  try {
    const { hostName, quiz, mode, allowLateJoin, showLeaderboardAfterEach } = req.body;
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({ error: 'Quiz with at least one question is required.' });
    }

    const code = generateRoomCode();
    const hostId = `host-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newRoom: Room = {
      code,
      hostId,
      hostName: hostName || 'Host',
      quiz: {
        ...quiz,
        id: quiz.id || `quiz-${Date.now()}`,
        createdAt: Date.now()
      },
      status: 'lobby',
      currentQuestionIndex: 0,
      mode: mode === 'host_guided' ? 'host_guided' : 'self_paced',
      createdAt: Date.now(),
      participants: {},
      allowLateJoin: allowLateJoin !== false,
      showLeaderboardAfterEach: showLeaderboardAfterEach !== false
    };

    rooms.set(code, newRoom);
    res.json({ success: true, room: newRoom, code, hostId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Get Room by Code
app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Quiz room not found or has expired.' });
  }
  res.json({ room });
});

// SSE Stream for Real-Time Updates
app.get('/api/rooms/:code/events', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(code)) {
    sseClients.set(code, new Set());
  }
  const clientSet = sseClients.get(code)!;
  clientSet.add(res);

  // Send initial state immediately
  res.write(`data: ${JSON.stringify({ type: 'ROOM_UPDATE', room })}\n\n`);

  // Keep-alive ping interval
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(pingInterval);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(pingInterval);
    clientSet.delete(res);
    if (clientSet.size === 0) {
      sseClients.delete(code);
    }
  });
});

// Join Room as Participant
app.post('/api/rooms/:code/join', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { name, avatar, color } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Please enter your name to join.' });
  }

  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Quiz room not found.' });
  }

  if (room.status === 'ended') {
    return res.status(400).json({ error: 'This quiz has already ended.' });
  }

  if (room.status === 'in_progress' && !room.allowLateJoin) {
    return res.status(400).json({ error: 'This quiz is in progress and late joins are disabled.' });
  }

  const participantId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const participant: Participant = {
    id: participantId,
    name: name.trim().substring(0, 30),
    avatar: avatar || '🎮',
    color: color || '#3B82F6',
    joinedAt: Date.now(),
    answers: {},
    currentQuestionIndex: 0,
    totalScore: 0,
    currentStreak: 0,
    highestStreak: 0,
    isFinished: false,
    lastActive: Date.now()
  };

  room.participants[participantId] = participant;
  broadcastRoomUpdate(code);

  res.json({ success: true, participant, room });
});

// Start Quiz (Host only)
app.post('/api/rooms/:code/start', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { hostId } = req.body;
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Room not found.' });
  if (room.hostId !== hostId) return res.status(403).json({ error: 'Unauthorized host.' });

  room.status = 'in_progress';
  room.currentQuestionIndex = 0;
  room.questionStartTime = Date.now();

  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

// Advance to next question (Host-guided mode)
app.post('/api/rooms/:code/next-question', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { hostId } = req.body;
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Room not found.' });
  if (room.hostId !== hostId) return res.status(403).json({ error: 'Unauthorized host.' });

  if (room.currentQuestionIndex + 1 >= room.quiz.questions.length) {
    room.status = 'ended';
  } else {
    room.currentQuestionIndex += 1;
    room.questionStartTime = Date.now();
  }

  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

// End Quiz (Host only)
app.post('/api/rooms/:code/end', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { hostId } = req.body;
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Room not found.' });
  if (room.hostId !== hostId) return res.status(403).json({ error: 'Unauthorized host.' });

  room.status = 'ended';
  // Mark all participants as finished if not already
  for (const p of Object.values(room.participants)) {
    p.isFinished = true;
    if (!p.finishedAt) p.finishedAt = Date.now();
  }

  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

// Kick Participant (Host only)
app.post('/api/rooms/:code/kick', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { hostId, participantId } = req.body;
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Room not found.' });
  if (room.hostId !== hostId) return res.status(403).json({ error: 'Unauthorized host.' });

  delete room.participants[participantId];
  broadcastRoomUpdate(code);
  res.json({ success: true, room });
});

// Submit Question Answer (Participant)
app.post('/api/rooms/:code/submit-answer', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { participantId, questionId, selectedIndex, timeTakenSec } = req.body;

  const room = rooms.get(code);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const participant = room.participants[participantId];
  if (!participant) return res.status(404).json({ error: 'Participant not found.' });

  const question = room.quiz.questions.find((q) => q.id === questionId);
  if (!question) return res.status(404).json({ error: 'Question not found.' });

  const isCorrect = selectedIndex === question.correctIndex;
  const basePoints = question.points || 1000;
  const maxTime = question.timeLimit || 20;
  const clampedTime = Math.min(Math.max(timeTakenSec || 0, 0), maxTime);

  let scoreEarned = 0;
  let nextStreak = participant.currentStreak;

  if (isCorrect) {
    // Speed factor: 50% guaranteed base points + 50% speed bonus
    const speedRatio = Math.max(0, (maxTime - clampedTime) / maxTime);
    const speedBonus = Math.round(basePoints * 0.5 * speedRatio);
    const rawPoints = Math.round(basePoints * 0.5) + speedBonus;

    // Streak multiplier bonus: +10% per consecutive correct answer up to +50%
    nextStreak = participant.currentStreak + 1;
    const streakBonusMultiplier = Math.min(0.5, (nextStreak - 1) * 0.1);
    scoreEarned = Math.round(rawPoints * (1 + streakBonusMultiplier));
  } else {
    nextStreak = 0;
    scoreEarned = 0;
  }

  const answerRecord: ParticipantAnswer = {
    questionId,
    selectedIndex,
    isCorrect,
    timeTakenSec: clampedTime,
    scoreEarned,
    streakAtAnswer: nextStreak,
    answeredAt: Date.now()
  };

  participant.answers[questionId] = answerRecord;
  participant.totalScore += scoreEarned;
  participant.currentStreak = nextStreak;
  if (nextStreak > participant.highestStreak) {
    participant.highestStreak = nextStreak;
  }
  participant.currentQuestionIndex += 1;
  participant.lastActive = Date.now();

  // Check if participant has answered all questions
  if (Object.keys(participant.answers).length >= room.quiz.questions.length) {
    participant.isFinished = true;
    participant.finishedAt = Date.now();
  }

  broadcastRoomUpdate(code);
  res.json({ success: true, answer: answerRecord, participant, room });
});

// Finish Participant Quiz
app.post('/api/rooms/:code/finish', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { participantId } = req.body;

  const room = rooms.get(code);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const participant = room.participants[participantId];
  if (!participant) return res.status(404).json({ error: 'Participant not found.' });

  participant.isFinished = true;
  participant.finishedAt = Date.now();
  participant.lastActive = Date.now();

  broadcastRoomUpdate(code);
  res.json({ success: true, participant, room });
});

// ================= VITE INTEGRATION =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuizPulse Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
