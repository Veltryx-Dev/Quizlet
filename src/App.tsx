/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { NameEntryModal } from './components/NameEntryModal';
import { LobbyView } from './components/LobbyView';
import { QuizPlayer } from './components/QuizPlayer';
import { LeaderboardView } from './components/LeaderboardView';
import { HostDashboard } from './components/HostDashboard';
import { ShareLinkModal } from './components/ShareLinkModal';
import { QuizBuilderModal } from './components/QuizBuilderModal';
import { QuestionReviewModal } from './components/QuestionReviewModal';
import { Room, Quiz, Participant, RoomMode, ParticipantAnswer } from './types';
import { DEFAULT_QUIZZES } from './data/defaultQuizzes';

export default function App() {
  // App views: 'entry' | 'lobby' | 'playing' | 'leaderboard' | 'host'
  const [currentView, setCurrentView] = useState<'entry' | 'lobby' | 'playing' | 'leaderboard' | 'host'>('entry');
  
  // Participant State
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState<string>('');
  const [participantAvatar, setParticipantAvatar] = useState<string>('🚀');
  const [participantColor, setParticipantColor] = useState<string>('#6366F1');

  // Room State
  const [currentRoomCode, setCurrentRoomCode] = useState<string>('');
  const [room, setRoom] = useState<Room | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [hostSecretId, setHostSecretId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Host Quizzes Library
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>(() => {
    try {
      const stored = localStorage.getItem('quizpulse_saved_quizzes');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_QUIZZES;
  });

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // SSE Event Source & Polling Ref
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Parse URL search params on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room') || params.get('join') || params.get('pin');
    if (roomParam) {
      setCurrentRoomCode(roomParam.toUpperCase());
    }
  }, []);

  // Save custom quizzes to local storage
  const handleSaveQuiz = (newQuiz: Quiz) => {
    setSavedQuizzes((prev) => {
      const existsIndex = prev.findIndex((q) => q.id === newQuiz.id);
      let updated;
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = newQuiz;
      } else {
        updated = [newQuiz, ...prev];
      }
      try {
        localStorage.setItem('quizpulse_saved_quizzes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteQuiz = (quizId: string) => {
    setSavedQuizzes((prev) => {
      const filtered = prev.filter((q) => q.id !== quizId);
      try {
        localStorage.setItem('quizpulse_saved_quizzes', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });
  };

  // Real-time synchronization (SSE with fallback polling)
  useEffect(() => {
    if (!currentRoomCode) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const sseUrl = `/api/rooms/${currentRoomCode}/events`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'ROOM_UPDATE' && payload.room) {
          handleIncomingRoomUpdate(payload.room);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
    };

    // Polling fallback every 3 seconds in case SSE disconnected
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${currentRoomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            handleIncomingRoomUpdate(data.room);
          }
        }
      } catch {}
    };

    pollIntervalRef.current = window.setInterval(fetchRoom, 3000);

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [currentRoomCode, participantId]);

  // Handle incoming room state updates
  const handleIncomingRoomUpdate = (updatedRoom: Room) => {
    setRoom(updatedRoom);

    // If user is participant:
    if (participantId && updatedRoom.participants) {
      const currentParticipant = updatedRoom.participants[participantId];
      
      // If participant was kicked:
      if (!currentParticipant && !isHost) {
        setErrorMessage('You have been removed from this room by the host.');
        setCurrentView('entry');
        setParticipantId(null);
        return;
      }

      if (currentParticipant) {
        if (updatedRoom.status === 'lobby') {
          setCurrentView('lobby');
        } else if (updatedRoom.status === 'in_progress') {
          if (currentParticipant.isFinished) {
            setCurrentView('leaderboard');
          } else {
            setCurrentView('playing');
          }
        } else if (updatedRoom.status === 'ended') {
          setCurrentView('leaderboard');
        }
      }
    }
  };

  // Join Room as Participant
  const handleJoinRoom = async (code: string, name: string, avatar: string, color: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar, color })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room.');
      }

      setParticipantId(data.participant.id);
      setParticipantName(data.participant.name);
      setParticipantAvatar(data.participant.avatar);
      setParticipantColor(data.participant.color);
      setCurrentRoomCode(code);
      setRoom(data.room);
      setIsHost(false);

      if (data.room.status === 'in_progress') {
        setCurrentView('playing');
      } else {
        setCurrentView('lobby');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not join room.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Host Launches Room
  const handleLaunchRoom = async (quiz: Quiz, mode: RoomMode, allowLateJoin: boolean, showLeaderboard: boolean) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: participantName || 'Quiz Master',
          quiz,
          mode,
          allowLateJoin,
          showLeaderboardAfterEach: showLeaderboard
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room.');
      }

      setRoom(data.room);
      setCurrentRoomCode(data.code);
      setHostSecretId(data.hostId);
      setIsHost(true);
      setCurrentView('host');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error launching room.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Host Starts Room
  const handleStartActiveRoom = async () => {
    if (!currentRoomCode || !hostSecretId) return;
    try {
      const res = await fetch(`/api/rooms/${currentRoomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: hostSecretId })
      });
      const data = await res.json();
      if (data.room) setRoom(data.room);
    } catch {}
  };

  // Host Advances Next Question
  const handleHostNextQuestion = async () => {
    if (!currentRoomCode || !hostSecretId) return;
    try {
      const res = await fetch(`/api/rooms/${currentRoomCode}/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: hostSecretId })
      });
      const data = await res.json();
      if (data.room) setRoom(data.room);
    } catch {}
  };

  // Host Ends Active Room
  const handleEndActiveRoom = async () => {
    if (!currentRoomCode || !hostSecretId) return;
    try {
      const res = await fetch(`/api/rooms/${currentRoomCode}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: hostSecretId })
      });
      const data = await res.json();
      if (data.room) setRoom(data.room);
    } catch {}
  };

  // Host Kicks Participant
  const handleKickParticipant = async (pId: string) => {
    if (!currentRoomCode || !hostSecretId) return;
    try {
      const res = await fetch(`/api/rooms/${currentRoomCode}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: hostSecretId, participantId: pId })
      });
      const data = await res.json();
      if (data.room) setRoom(data.room);
    } catch {}
  };

  // Participant Submits Answer
  const handleSubmitAnswer = async (questionId: string, selectedIndex: number, timeTakenSec: number): Promise<ParticipantAnswer | null> => {
    if (!currentRoomCode || !participantId) return null;
    try {
      const res = await fetch(`/api/rooms/${currentRoomCode}/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          questionId,
          selectedIndex,
          timeTakenSec
        })
      });

      const data = await res.json();
      if (data.room) {
        setRoom(data.room);
      }
      return data.answer || null;
    } catch {
      return null;
    }
  };

  // Participant Advances to Next Question or Finishes
  const handleParticipantNext = async () => {
    if (!room || !participantId) return;
    const currentParticipant = room.participants[participantId];
    if (!currentParticipant) return;

    const answeredCount = Object.keys(currentParticipant.answers || {}).length;
    const totalQuestions = room.quiz.questions.length;

    if (answeredCount >= totalQuestions) {
      try {
        await fetch(`/api/rooms/${currentRoomCode}/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId })
        });
      } catch {}
      setCurrentView('leaderboard');
    }
  };

  // Exit / Leave current room
  const handleExitRoom = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setParticipantId(null);
    setCurrentRoomCode('');
    setRoom(null);
    setIsHost(false);
    setHostSecretId('');
    setCurrentView('entry');
  };

  // Get current participant object
  const currentParticipant = participantId && room?.participants ? room.participants[participantId] : null;
  const currentQuestionIdx = currentParticipant ? Object.keys(currentParticipant.answers || {}).length : 0;
  const currentQuestion = room?.quiz.questions[currentQuestionIdx] || room?.quiz.questions[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Global Navbar */}
      <Navbar
        roomCode={currentRoomCode}
        roomStatus={room?.status}
        isHost={isHost}
        participantName={participantName || (isHost ? 'Quiz Master' : undefined)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onExit={currentRoomCode ? handleExitRoom : undefined}
        onOpenLeaderboardModal={room ? () => setCurrentView('leaderboard') : undefined}
      />

      {/* Main App Content router */}
      <main className="flex-1">
        {/* 1. Name Entry & Onboarding */}
        {currentView === 'entry' && (
          <NameEntryModal
            initialCode={currentRoomCode}
            onJoinRoom={handleJoinRoom}
            onGoToHost={(name) => {
              setParticipantName(name);
              setCurrentView('host');
            }}
            onCreateQuiz={(name) => {
              setParticipantName(name);
              setCurrentView('host');
              setEditingQuiz(null);
              setIsBuilderModalOpen(true);
            }}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage('')}
          />
        )}

        {/* 2. Participant Lobby */}
        {currentView === 'lobby' && room && (
          <LobbyView
            room={room}
            currentParticipantId={participantId || undefined}
            isHost={isHost}
            onStartQuiz={handleStartActiveRoom}
            onKickParticipant={isHost ? handleKickParticipant : undefined}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}

        {/* 3. Active Quiz Player */}
        {currentView === 'playing' && room && currentQuestion && (
          <QuizPlayer
            question={currentQuestion}
            questionIndex={currentQuestionIdx}
            totalQuestions={room.quiz.questions.length}
            currentScore={currentParticipant?.totalScore || 0}
            currentStreak={currentParticipant?.currentStreak || 0}
            onSubmitAnswer={handleSubmitAnswer}
            onNextQuestion={handleParticipantNext}
            isLastQuestion={currentQuestionIdx + 1 >= room.quiz.questions.length}
          />
        )}

        {/* 4. Final Scores & Leaderboard Rankings */}
        {currentView === 'leaderboard' && room && (
          <LeaderboardView
            room={room}
            currentParticipantId={participantId || undefined}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onReturnHome={handleExitRoom}
          />
        )}

        {/* 5. Host Studio & Active Host Room */}
        {currentView === 'host' && (
          <HostDashboard
            hostName={participantName || 'Quiz Master'}
            activeRoom={isHost ? room : null}
            savedQuizzes={savedQuizzes}
            onLaunchRoom={handleLaunchRoom}
            onOpenCreateQuizModal={() => {
              setEditingQuiz(null);
              setIsBuilderModalOpen(true);
            }}
            onEditQuiz={(quiz) => {
              setEditingQuiz(quiz);
              setIsBuilderModalOpen(true);
            }}
            onDeleteQuiz={handleDeleteQuiz}
            onStartActiveRoom={handleStartActiveRoom}
            onNextQuestion={handleHostNextQuestion}
            onEndActiveRoom={handleEndActiveRoom}
            onKickParticipant={handleKickParticipant}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenLeaderboardView={() => setCurrentView('leaderboard')}
            onLeaveHostRoom={() => {
              setIsHost(false);
              setHostSecretId('');
              setRoom(null);
              setCurrentRoomCode('');
            }}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Share Link & QR Code Modal */}
      {room && (
        <ShareLinkModal
          roomCode={room.code}
          quizTitle={room.quiz.title}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* 2. Custom Quiz Editor Modal */}
      <QuizBuilderModal
        isOpen={isBuilderModalOpen}
        initialQuiz={editingQuiz}
        onClose={() => {
          setIsBuilderModalOpen(false);
          setEditingQuiz(null);
        }}
        onSaveQuiz={handleSaveQuiz}
      />

      {/* 4. Question Review Modal */}
      {room && currentParticipant && (
        <QuestionReviewModal
          questions={room.quiz.questions}
          answers={currentParticipant.answers || {}}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}

    </div>
  );
}
