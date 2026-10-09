import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseConfig";
import {
  AchievementVersion,
  Achievements,
  AiChatSession,
  ArtifactData,
  ArtifactKind,
  ChatbotStyle,
  Exercise,
  GenerationOptions,
  StructuredLesson,
  UserProfile,
} from "../types";

export interface AchievementRewardResponse {
  milestone: number;
  kind: ArtifactKind;
  artifact: ArtifactData;
  transcricao: string;
  audioWavBase64: string;
}

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
    const generateExerciseWithGemini = httpsCallable<
      { lessonTitle: string; userPrompt: string; existingExercises: Exercise[] },
      { exercise: Omit<Exercise, "id" | "numero"> }
    >(functions, "generateExerciseWithGemini");

    const result = await generateExerciseWithGemini({
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

export const createStudentChatSession = (style: ChatbotStyle = "Xarope"): AiChatSession => ({
  kind: "student",
  style,
  history: [],
});

export const sendStudentChatMessage = async (chat: AiChatSession, message: string): Promise<string> => {
  try {
    const sendStudentChatWithGemini = httpsCallable<
      { message: string; style: ChatbotStyle; history: any[] },
      { text: string }
    >(functions, "sendStudentChatWithGemini");

    const result = await sendStudentChatWithGemini({
      message,
      style: chat.style || "Xarope",
      history: chat.history,
    });

    const text = result.data.text;
    chat.history.push({ role: "user", content: message, timestamp: Date.now() });
    chat.history.push({ role: "model", content: text, timestamp: Date.now() + 1 });
    return text;
  } catch (error) {
    console.error("Error in student chat:", error);
    return "Erro. Tente de novo.";
  }
};

export const evaluateStudentAnswer = async (studentAnswer: string, exercise: Exercise): Promise<string> => {
  try {
    const evaluateStudentAnswerWithGemini = httpsCallable<
      { studentAnswer: string; exercise: Exercise },
      { text: string }
    >(functions, "evaluateStudentAnswerWithGemini");

    const result = await evaluateStudentAnswerWithGemini({
      studentAnswer,
      exercise,
    });

    return result.data.text;
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return "Erro\nDesculpe, não consegui avaliar sua resposta agora. Verifique sua conexão e tente novamente.";
  }
};

export const generateAchievementReward = async (
  milestone: number,
  userProfile?: UserProfile | null,
  achievements?: Achievements,
  previousVersions?: AchievementVersion[]
): Promise<AchievementRewardResponse | { error: string }> => {
  try {
    const generateAchievementRewardWithGemini = httpsCallable<
      {
        milestone: number;
        userProfile: UserProfile | Record<string, never>;
        achievements: Achievements | Record<string, never>;
        previousVersions: AchievementVersion[];
      },
      AchievementRewardResponse
    >(functions, "generateAchievementRewardWithGemini");

    const result = await generateAchievementRewardWithGemini({
      milestone,
      userProfile: userProfile || {},
      achievements: achievements || {},
      previousVersions: previousVersions || [],
    });

    return result.data;
  } catch (error: any) {
    console.error("Erro ao gerar recompensa de marco:", error);
    return { error: error?.message || "Ocorreu um erro ao gerar sua recompensa. Tente novamente." };
  }
};

export const generateInteractiveLesson = async (
  lessonTitle: string,
  lessonContent: string,
  options: GenerationOptions
): Promise<StructuredLesson | string> => {
  try {
    const generateInteractiveLessonWithGemini = httpsCallable<
      { lessonTitle: string; lessonContent: string; options: GenerationOptions },
      { lesson: StructuredLesson }
    >(functions, "generateInteractiveLessonWithGemini");

    const result = await generateInteractiveLessonWithGemini({
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

export const answerQuestionAboutLesson = async (lessonContent: string, question: string): Promise<string> => {
  try {
    const answerLessonQuestionWithGemini = httpsCallable<
      { lessonContent: string; question: string },
      { text: string }
    >(functions, "answerLessonQuestionWithGemini");

    const result = await answerLessonQuestionWithGemini({
      lessonContent,
      question,
    });

    return result.data.text;
  } catch (error) {
    console.error("Error answering question:", error);
    return "Desculpe, não consegui processar sua pergunta agora. Tente novamente.";
  }
};
