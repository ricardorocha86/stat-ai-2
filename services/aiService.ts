import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseConfig";
import {
  AiChatSession,
  ChatbotStyle,
  Exercise,
  GenerationOptions,
  LessonReference,
  StructuredLesson,
} from "../types";

// The model reasons before answering; allow more than the 70 s callable default.
const AI_TIMEOUT_MS = 180_000;
const LONG_AI_TIMEOUT_MS = 330_000;

export const createChatSession = (lessonTitle: string): AiChatSession => ({
  kind: "exercise",
  lessonTitle,
  history: [],
});

export const generateExercise = async (
  chat: AiChatSession,
  lessonTitle: string,
  existingExercises: Exercise[],
  userPrompt: string
): Promise<Omit<Exercise, "id" | "numero"> | string> => {
  try {
    const generateExerciseCallable = httpsCallable<
      { lessonTitle: string; userPrompt: string; existingExercises: Exercise[] },
      { exercise: Omit<Exercise, "id" | "numero"> }
    >(functions, "generateExercise", { timeout: AI_TIMEOUT_MS });

    const result = await generateExerciseCallable({
      lessonTitle,
      userPrompt,
      existingExercises,
    });

    const exercise = result.data.exercise;
    chat.history.push({ role: "user", content: userPrompt, timestamp: Date.now() });
    chat.history.push({ role: "model", content: JSON.stringify(exercise), timestamp: Date.now() + 1 });
    return exercise;
  } catch (error) {
    console.error("Error generating exercise:", error);
    return "Desculpe, ocorreu um erro ao tentar gerar o exercício. Por favor, tente novamente.";
  }
};

export const createStudentChatSession = (style: ChatbotStyle = "Padrão"): AiChatSession => ({
  kind: "student",
  style,
  history: [],
});

export const sendStudentChatMessage = async (
  chat: AiChatSession,
  message: string
): Promise<{ text: string; lessons: LessonReference[] }> => {
  try {
    const sendStudentChat = httpsCallable<
      { message: string; style: ChatbotStyle; history: { role: string; content: string }[] },
      { text: string; lessons?: LessonReference[] }
    >(functions, "sendStudentChat", { timeout: AI_TIMEOUT_MS });

    const result = await sendStudentChat({
      message,
      style: chat.style || "Padrão",
      history: chat.history.map(({ role, content }) => ({ role, content })),
    });

    const { text, lessons = [] } = result.data;
    chat.history.push({ role: "user", content: message, timestamp: Date.now() });
    chat.history.push({ role: "model", content: text, timestamp: Date.now() + 1 });
    return { text, lessons };
  } catch (error) {
    console.error("Error in student chat:", error);
    return { text: "Não consegui responder agora. Tente novamente em instantes.", lessons: [] };
  }
};

export const evaluateStudentAnswer = async (studentAnswer: string, exercise: Exercise): Promise<string> => {
  try {
    const evaluateStudentAnswerCallable = httpsCallable<
      { studentAnswer: string; exercise: Exercise },
      { text: string }
    >(functions, "evaluateStudentAnswer", { timeout: AI_TIMEOUT_MS });

    const result = await evaluateStudentAnswerCallable({
      studentAnswer,
      exercise,
    });

    return result.data.text;
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return "Erro\nDesculpe, não consegui avaliar sua resposta agora. Verifique sua conexão e tente novamente.";
  }
};

export const generateInteractiveLesson = async (
  lessonTitle: string,
  lessonContent: string,
  options: GenerationOptions
): Promise<StructuredLesson | string> => {
  try {
    const generateInteractiveLessonCallable = httpsCallable<
      { lessonTitle: string; lessonContent: string; options: GenerationOptions },
      { lesson: StructuredLesson }
    >(functions, "generateInteractiveLesson", { timeout: LONG_AI_TIMEOUT_MS });

    const result = await generateInteractiveLessonCallable({
      lessonTitle,
      lessonContent,
      options,
    });

    return result.data.lesson;
  } catch (error) {
    console.error("Error generating interactive lesson:", error);
    return "Desculpe, ocorreu um erro ao gerar o material de aula. Por favor, tente novamente.";
  }
};
