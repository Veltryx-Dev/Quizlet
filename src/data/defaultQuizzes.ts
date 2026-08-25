import { Quiz } from '../types';

export const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 'my-custom-quiz-1',
    title: '🧠 My First Custom Quiz',
    description: 'A customizable 4-option quiz. Edit or create your own custom questions!',
    category: 'General Trivia',
    createdAt: Date.now(),
    questions: [
      {
        id: 'q1',
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
        correctIndex: 1,
        timeLimit: 20,
        points: 1000,
        explanation: 'Mars appears reddish because of widespread iron oxide (rust) on its surface.',
        category: 'Science'
      },
      {
        id: 'q2',
        question: 'How many sides does a hexagon have?',
        options: ['5', '6', '7', '8'],
        correctIndex: 1,
        timeLimit: 15,
        points: 1000,
        explanation: 'A hexagon is a six-sided polygon.',
        category: 'Math'
      }
    ]
  }
];
