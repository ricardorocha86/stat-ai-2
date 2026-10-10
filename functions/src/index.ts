import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import OpenAI from "openai";
import { canEvaluateExercise, createEvaluationRequest, evaluateChoiceAnswer, formatEvaluationResponse } from "./exerciseEvaluation";

initializeApp();

type ChatbotStyle = "Padrão" | "Xarope" | "Amiguinho";
type ChatHistoryItem = { role: "user" | "model"; content: string };

const region = "southamerica-east1";
const openAiSecret = ["OPENAI_API_KEY"];
// Every text generation call uses GPT-6.1 Sol with medium reasoning.
const TEXT_MODEL = "gpt-6.1-sol";
const REASONING = { effort: "medium" as const };

const getAi = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "OPENAI_API_KEY não configurada.");
  }
  return new OpenAI({ apiKey });
};

const requireAuth = (request: CallableRequest) => {
  // Anonymous sign-in exists only for the cover votes; the AI needs a student's Google account.
  if (!request.auth || request.auth.token?.firebase?.sign_in_provider === "anonymous") {
    throw new HttpsError("unauthenticated", "Apenas usuários logados podem solicitar IA.");
  }
};

const assertString = (value: unknown, field: string, maxLength: number) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpsError("invalid-argument", `${field} é obrigatório.`);
  }
  if (value.length > maxLength) {
    throw new HttpsError("invalid-argument", `${field} é longo demais.`);
  }
  return value.trim();
};

const parseJsonOutput = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpsError("internal", "A IA retornou um formato inválido.");
  }
};

const historyToInput = (history: ChatHistoryItem[] = [], message: string) => {
  const safeHistory = history
    .filter((item) => item && (item.role === "user" || item.role === "model") && typeof item.content === "string")
    .slice(-12)
    .map((item) => ({
      role: item.role === "model" ? "assistant" as const : "user" as const,
      content: item.content.slice(0, 8000),
    }));

  return [...safeHistory, { role: "user" as const, content: message }];
};

const CHATBOT_STYLES: ChatbotStyle[] = ["Padrão", "Xarope", "Amiguinho"];

// Only the tone block changes with the student's choice; the student can switch it mid-conversation.
const TONES: Record<ChatbotStyle, string> = {
  "Padrão": `Tom "Padrão": profissional e equilibrado.
- Explique com clareza e objetividade, como um bom professor em atendimento individual.
- Sem ironia, sem gírias e sem emojis.`,
  "Xarope": `Tom "Xarope": o tutor ranzinza e sarcástico.
- Você é um professor veterano de estatística, impaciente de brincadeira e cheio de ironia, mas que adora a matéria e sempre entrega a explicação certa e completa.
- Abra com uma alfinetada bem-humorada sobre a pergunta ou o tema. Exemplo: "Ah, a mediana. Aquela que ninguém lembra até o salário do chefe estragar a média."
- Solte comentários ácidos curtos no meio da explicação e feche com uma provocação. Exemplo: "Pronto. Agora vai lá e não me venha somar porcentagens de novo."
- O sarcasmo mira a situação, o tema ou os erros clássicos, nunca a pessoa: nada de xingamentos nem comentários sobre a inteligência ou qualquer característica do aluno.
- O sarcasmo precisa ficar evidente em toda resposta, inclusive nas curtas e nas recusas. Nada de emojis fofos.`,
  "Amiguinho": `Tom "Amiguinho": o tutor ultra animado.
- Você é extremamente entusiasmado, carinhoso e encorajador, como um amigo que vibra com cada dúvida.
- Comemore a pergunta logo na abertura. Exemplo: "Que pergunta incrível! 🤩"
- Use de 2 a 4 emojis e exclamações, sem atrapalhar a leitura das fórmulas.
- Elogie o esforço, transforme erros em incentivo e feche com uma frase motivadora.`,
};

const FORMATTING_RULES = `Formatação: escreva em Markdown. Use $...$ para fórmulas na linha e $$...$$ para fórmulas em destaque (LaTeX). Escreva valores em reais como "R$ 10,00" fora de fórmulas.`;

const requireLessonVectorStore = () => {
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
  if (!vectorStoreId?.trim()) {
    throw new HttpsError(
      "failed-precondition",
      "OPENAI_VECTOR_STORE_ID não configurado. Execute scripts/build-lesson-vector-store.mjs e configure o ID do vector store."
    );
  }
  return vectorStoreId.trim();
};

// Lesson files are uploaded as "Aula NN - Título.md"; citations carry that file name.
// The app turns each reference into a link to the lesson.
const extractLessonReferences = (response: OpenAI.Responses.Response) => {
  const lessons = new Map<number, string>();
  for (const item of response.output) {
    if (item.type !== "message") continue;
    for (const part of item.content) {
      if (part.type !== "output_text") continue;
      for (const annotation of part.annotations) {
        const match = annotation.type === "file_citation" ? annotation.filename?.match(/^Aula (\d+) - (.+?)(?:\.md)?$/i) : null;
        if (match) lessons.set(Number(match[1]), match[2]);
      }
    }
  }
  return [...lessons].sort(([a], [b]) => a - b).slice(0, 5).map(([number, title]) => ({ number, title }));
};

// file_search can leave private-use citation markers (U+E200 … U+E201) in the text; the lessons are listed separately.
const stripCitationMarkers = (text: string) => text.replace(/[ \t]*\uE200[^\uE201]*\uE201/g, "");

const getStudentInstruction = (style: ChatbotStyle) => `Você é o Stat, tutor de estatística do portal StatAI, conversando em português com estudantes de graduação.

# Tom de voz
${TONES[style]}
O tom vale para a resposta inteira. Se mensagens anteriores da conversa estiverem em outro tom, ignore-as nesse ponto: o aluno acabou de escolher este tom.
O tom muda só o jeito de falar; o conteúdo estatístico continua correto e completo em qualquer tom.

# Base nas aulas
- Use a busca nos arquivos das aulas em todas as respostas sobre conteúdo de estatística.
- Responda com base prioritária nos trechos recuperados das aulas do StatAI.
- Se os trechos recuperados não forem suficientes, diga isso antes de complementar com conhecimento geral de estatística.
- Não diga que algo está em uma aula se a busca não trouxe esse conteúdo.
- Cite no texto a aula usada como base, por exemplo: "como na Aula 08 — Medidas de Tendência Central". As aulas consultadas também aparecem como links abaixo da resposta; não as liste no fim.

# Foco
Se a pergunta não for sobre estatística ou sobre o app StatAI, recuse em uma frase, no tom escolhido. Responda só o que foi perguntado, sem rodeios.

# Formatação
${FORMATTING_RULES}`;

export const generateExercise = onCall(
  { secrets: openAiSecret, region, timeoutSeconds: 180 },
  async (request) => {
    requireAuth(request);

    const lessonTitle = assertString(request.data?.lessonTitle, "lessonTitle", 300);
    const userPrompt = assertString(request.data?.userPrompt, "userPrompt", 4000);
    const existingExercises = Array.isArray(request.data?.existingExercises)
      ? request.data.existingExercises
      : [];

    let prompt = `O tópico da aula é "${lessonTitle}".`;

    if (existingExercises.length > 0) {
      prompt += "\n\nOs seguintes exercícios já foram criados para esta aula:\n";
      existingExercises.slice(0, 20).forEach((exercise: any, index: number) => {
        const statement = String(exercise?.enunciado || "").slice(0, 180);
        prompt += `${index + 1}. [Dificuldade: ${exercise?.dificuldade || "N/A"}] ${statement}...\n`;
      });
      prompt += "\nCrie um novo exercício que complemente os anteriores, evitando repetições e variando a dificuldade ou o tipo.";
    } else {
      prompt += "\nCrie o primeiro exercício para esta aula.";
    }

    prompt += `\n\nInstrução do professor: "${userPrompt}"`;

    try {
      const response = await getAi().responses.create({
        model: TEXT_MODEL,
        reasoning: REASONING,
        instructions: `Você é um assistente especialista em estatística, criando exercícios em Português para estudantes de graduação. Gere exercícios claros, variados e com quatro etapas de ajuda: dica, passo inicial, resolução comentada e resposta final. A dica deve orientar sem resolver; o passo inicial deve mostrar como começar; a resolução deve explicar o raciocínio; a resposta final deve resumir os resultados e suas unidades.\n\n${FORMATTING_RULES}`,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "exercicio",
            strict: true,
            schema: {
              type: "object",
              properties: {
                enunciado: { type: "string" },
                dificuldade: { type: "string", enum: ["Fácil", "Médio", "Difícil"] },
                dica: { type: "string" },
                passo_inicial: { type: "string" },
                solucao_completa: { type: "string" },
                resposta_final: { type: "string" },
              },
              required: ["enunciado", "dificuldade", "dica", "passo_inicial", "solucao_completa", "resposta_final"],
              additionalProperties: false,
            },
          },
        },
      });

      return { exercise: parseJsonOutput(response.output_text) };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("Erro ao gerar exercício:", error);
      throw new HttpsError("internal", "Erro ao gerar exercício.");
    }
  }
);

export const sendStudentChat = onCall(
  { secrets: openAiSecret, region, timeoutSeconds: 120 },
  async (request) => {
    requireAuth(request);

    const message = assertString(request.data?.message, "message", 4000);
    const style = CHATBOT_STYLES.includes(request.data?.style) ? request.data.style as ChatbotStyle : "Padrão";
    const history = Array.isArray(request.data?.history) ? request.data.history : [];
    const vectorStoreId = requireLessonVectorStore();

    try {
      const response = await getAi().responses.create({
        model: TEXT_MODEL,
        reasoning: REASONING,
        tools: [{ type: "file_search", vector_store_ids: [vectorStoreId], max_num_results: 5 }],
        instructions: getStudentInstruction(style),
        input: historyToInput(history, message),
      });

      return { text: stripCitationMarkers(response.output_text).trim(), lessons: extractLessonReferences(response) };
    } catch (error) {
      console.error("Erro no chat do aluno:", error);
      throw new HttpsError("internal", "Erro ao responder chat.");
    }
  }
);

export const evaluateStudentAnswer = onCall(
  { secrets: openAiSecret, region, timeoutSeconds: 120 },
  async (request) => {
    requireAuth(request);

    const studentAnswer = assertString(request.data?.studentAnswer, "studentAnswer", 8000);
    const exercise = request.data?.exercise || {};
    if (!canEvaluateExercise(exercise)) {
      throw new HttpsError("failed-precondition", "Este item não permite correção automática. Use o roteiro e os critérios de avaliação.");
    }
    const choiceResult = evaluateChoiceAnswer(studentAnswer, exercise);
    if (choiceResult) return { text: choiceResult };

    try {
      const response = await getAi().responses.create({
        model: TEXT_MODEL,
        reasoning: REASONING,
        ...createEvaluationRequest(studentAnswer, exercise),
      });

      return { text: formatEvaluationResponse(response.output_text) };
    } catch (error) {
      console.error("Erro ao avaliar resposta:", error);
      throw new HttpsError("internal", "Erro ao avaliar resposta.");
    }
  }
);

export const generateInteractiveLesson = onCall(
  { secrets: openAiSecret, region, timeoutSeconds: 300 },
  async (request) => {
    requireAuth(request);

    const lessonTitle = assertString(request.data?.lessonTitle, "lessonTitle", 300);
    const lessonContent = assertString(request.data?.lessonContent, "lessonContent", 200000);
    const options = request.data?.options || {};

    const lengthMap: Record<string, string> = {
      curto: "um resumo conciso com cerca de 300 palavras.",
      médio: "um material detalhado com cerca de 700 palavras.",
      longo: "uma exploração aprofundada com mais de 1200 palavras.",
    };
    const levelMap: Record<string, string> = {
      iniciante: "uma linguagem simples e acessível, ideal para quem está começando.",
      intermediário: "uma linguagem que assume algum conhecimento prévio, com um pouco mais de profundidade técnica.",
      avançado: "uma linguagem técnica e formal, adequada para estudantes com base sólida no assunto.",
    };
    const focus = typeof options.focus === "string" && options.focus.trim() ? options.focus.trim().slice(0, 200) : "Geral";

    const prompt = `
Você é um adaptador de material didático especialista em estatística. Adapte o MATERIAL DO PROFESSOR para a realidade do aluno, mudando apenas o contexto dos exemplos.

--- MATERIAL ORIGINAL DO PROFESSOR ---
${lessonContent}
--- FIM DO MATERIAL ORIGINAL ---

Regras:
1. Mantenha a estrutura original.
2. Não mude equações, fórmulas, datas, valores numéricos ou estatísticas.
3. Mantenha imagens na mesma posição relativa e preserve o src.
4. Área de foco: "${focus}".
5. Linguagem: ${levelMap[options.level] || levelMap["intermediário"]}.
6. Tamanho: ${lengthMap[options.length] || lengthMap["médio"]}.
7. Emojis: ${options.useEmojis ? "use de forma didática e moderada" : "não use emojis"}.
8. Fórmulas: mantenha em LaTeX como no original, entre $...$ (na linha) ou $$...$$ (em destaque). Nunca coloque fórmulas dentro de <code> ou <pre>. Escreva valores em reais como R$ 10,00, fora das fórmulas.

Retorne JSON com quatro chaves, todas preenchidas:
- introducao: apresentação curta do tema no contexto do aluno;
- teoria: conceitos, definições e fórmulas;
- exemplos: os exemplos e aplicações numéricas do material, adaptados ao contexto (se o original misturar exemplos com a teoria, traga-os para cá);
- questionamentos: de 3 a 5 perguntas para reflexão, em <ul>.
Cada valor deve ser HTML usando apenas: <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre>, <blockquote>, <img>.
`;

    try {
      const response = await getAi().responses.create({
        model: TEXT_MODEL,
        reasoning: REASONING,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "material_adaptado",
            strict: true,
            schema: {
              type: "object",
              properties: {
                introducao: { type: "string" },
                teoria: { type: "string" },
                exemplos: { type: "string" },
                questionamentos: { type: "string" },
              },
              required: ["introducao", "teoria", "exemplos", "questionamentos"],
              additionalProperties: false,
            },
          },
        },
      });

      const lesson = parseJsonOutput(response.output_text);
      const sectionSizes = Object.entries(lesson).map(([key, value]) => `${key}=${String(value || "").trim().length}`).join(" ");
      if (Object.values(lesson).some((value) => !String(value || "").trim())) {
        console.warn("Material interativo com seção vazia:", sectionSizes);
      }
      // The app hides an empty section; without the theory there is no material to show.
      if (!String(lesson.teoria || "").trim()) {
        console.error("Material interativo incompleto:", response.status, response.incomplete_details, sectionSizes);
        throw new HttpsError("internal", "A IA retornou um material incompleto. Tente novamente.");
      }
      return { lesson };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("Erro ao gerar material interativo:", error);
      throw new HttpsError("internal", "Erro ao gerar material interativo.");
    }
  }
);
