import { Chat } from "@google/genai";

export type ExerciseDifficulty = 'Fácil' | 'Médio' | 'Difícil';
export type ExerciseType = 'Conceitual' | 'Cálculo' | 'Interpretação de Dados';

export interface Solution {
  hint: string;
  startingGuide: string;
  fullSolution: string;
}

export interface Exercise {
  id: string;
  problemStatement: string;
  difficulty: ExerciseDifficulty;
  type: ExerciseType;
  solution: Solution;
}

export interface Lesson {
  id:string;
  title: string;
  filePath: string;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  title: string;
  units: Unit[];
}

export type ChatAction = {
    label: string;
    handler: () => void;
};

export type ChatMessage = {
  role: 'user' | 'model';
  content: string | Exercise;
  timestamp: number;
  actions?: ChatAction[];
};

export type StudentChatMessage = {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatSessionCache {
  [lessonId: string]: Chat;
}

export type ViewMode = 'professor' | 'aluno';

export type Page = 'home' | 'lesson' | 'about';

export type StudentProgress = {
  [lessonId: string]: Set<string>; // Set of completed exercise IDs for each lesson
};

export type AchievementMilestone = 10 | 20 | 30 | 40 | 50;

export type AchievementType = 'image' | 'audio';

export interface Achievement {
  milestone: AchievementMilestone;
  unlockedAt: number; // timestamp
  type: AchievementType;
  title: string;
  storyText: string;
  contentBase64?: string; // For images
}

export interface AchievementDisplayState {
  milestone: AchievementMilestone;
  isLoading: boolean;
  type?: AchievementType;
  title?: string;
  storyText?: string;
  contentBase64?: string;
  error?: string;
}


export interface Achievements {
  [milestone: number]: Achievement;
}

export interface UserProfile {
  name: string;
  email: string;
  photoBase64?: string;
  photoMimeType?: string;
}

export interface GenerationOptions {
    focus: string;
    length: 'curto' | 'médio' | 'longo';
    level: 'iniciante' | 'intermediário' | 'avançado';
    useEmojis: boolean;
}

export interface QAMessage {
    role: 'user' | 'model';
    content: string;
}

export interface StructuredLesson {
    introducao: string;
    teoria: string;
    exemplos: string;
    questionamentos: string;
}