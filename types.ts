export type ExerciseDifficulty = 'Fácil' | 'Médio' | 'Difícil';
export interface Exercise {
  id: string;
  numero: number;
  enunciado?: string;
  dificuldade?: ExerciseDifficulty;
  dica?: string;
  passo_inicial?: string;
  solucao_completa?: string;
  resposta_final?: string;
  pendencias?: string[];
  solucao_original?: string;
  enunciado_original?: string;
  correcao_automatica?: boolean;
  criterios_avaliacao?: string[];
  gabarito_meta?: {
    origem: 'autor' | 'recalculado' | 'elaborado' | 'roteiro';
    conferido_enunciado?: boolean;
    observacoes?: string;
    referencias: {
      tipo: 'material' | 'livro' | 'gabarito';
      arquivo: string;
      capitulo?: number;
      questao?: string;
      pagina_pdf?: number;
      linha_inicial?: number;
      linha_final?: number;
      url?: string;
    }[];
  };
  titulo?: string;
  numero_original?: string;
  categoria?: 'exercicio' | 'multipla_escolha' | 'atividade';
  resourceBasePath?: string;
  subitens?: { id: string; texto: string }[];
  alternativas?: { id: string; texto: string }[];
  origem?: { arquivo: string; linha_inicial: number; linha_final: number; aula: number };
}

export interface Lesson {
  id:string;
  title: string;
  filePath: string;
  exercises: Exercise[];
  exercisesPath?: string;
  number?: number;
  exerciseCount?: number;
  sourcePath?: string;
  // 'reference': the page about the book the course is based on, shown without lesson tabs.
  kind?: 'reference';
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  title: string;
  contentVersion?: string;
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

// A lesson the tutor consulted to answer, from the lesson index.
export type LessonReference = {
  number: number;
  title: string;
};

export type StudentChatMessage = {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  lessons?: LessonReference[];
}

export interface AiChatSession {
  kind: 'exercise' | 'student';
  lessonTitle?: string;
  style?: ChatbotStyle;
  history: StudentChatMessage[];
}

export interface ChatSessionCache {
  [lessonId: string]: AiChatSession;
}

export type ViewMode = 'professor' | 'aluno';

export type Page = 'home' | 'lesson' | 'about' | 'profile';

export type StudentProgress = {
  [lessonId: string]: Set<string>; // Set of completed exercise IDs for each lesson
};

export type AchievementMilestone = 10 | 20 | 30 | 40 | 50;

export type ArtifactKind = 'card_marco' | 'selo' | 'anotacao' | 'carta' | 'diploma';

export interface CardMarcoArtifact {
  kind: 'card_marco';
  titulo: string;
  reconhecimento: string;
  corpo: string;
  projecao: string;
}

export interface SeloArtifact {
  kind: 'selo';
  titulo_selo: string;
  virtude_reconhecida: string;
  principio: string;
  convite: string;
}

export interface AnotacaoArtifact {
  kind: 'anotacao';
  data_simbolica: string;
  abertura: string;
  observacao: string;
  fechamento: string;
}

export interface CartaArtifact {
  kind: 'carta';
  saudacao: string;
  paragrafos: string[];
  fecho: string;
  assinatura: string;
}

export interface DiplomaArtifact {
  kind: 'diploma';
  titulo_concedido: string;
  considerando: string;
  outorga: string;
  data_simbolica: string;
}

export type ArtifactData =
  | CardMarcoArtifact
  | SeloArtifact
  | AnotacaoArtifact
  | CartaArtifact
  | DiplomaArtifact;

export interface AchievementVersion {
  artifact: ArtifactData;
  transcricao: string;
  audioUrl: string;
  generatedAt: number;
}

export interface Achievement {
  milestone: AchievementMilestone;
  unlockedAt: number;
  kind: ArtifactKind;
  artifact: ArtifactData;
  transcricao: string;
  audioUrl: string;
  previousVersions?: AchievementVersion[];
}

export interface AchievementDisplayState {
  milestone: AchievementMilestone;
  isLoading: boolean;
  isRegenerating?: boolean;
  kind?: ArtifactKind;
  artifact?: ArtifactData;
  transcricao?: string;
  audioUrl?: string;
  error?: string;
}

export interface Achievements {
  [milestone: number]: Achievement;
}

export const MILESTONE_KIND: Record<AchievementMilestone, ArtifactKind> = {
  10: 'card_marco',
  20: 'selo',
  30: 'anotacao',
  40: 'carta',
  50: 'diploma',
};

export type ChatbotStyle = 'Padrão' | 'Xarope' | 'Amiguinho';

export interface UserProfile {
  name: string;
  email: string;
  photoBase64?: string;
  photoMimeType?: string;
  userType?: 'nutrição' | 'convidado';
  registrationNumber?: string;
  origin?: string;
  isOnboarded?: boolean;
  chatbotStyle?: ChatbotStyle;
  // Last lesson the student opened, for "continue where you left off" on the home page.
  lastLessonId?: string;
}

export interface GenerationOptions {
    focus: string;
    length: 'curto' | 'médio' | 'longo';
    level: 'iniciante' | 'intermediário' | 'avançado';
    useEmojis: boolean;
}

export interface StructuredLesson {
    introducao: string;
    teoria: string;
    exemplos: string;
    questionamentos: string;
}
