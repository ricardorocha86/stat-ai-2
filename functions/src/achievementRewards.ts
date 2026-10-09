// PAUSED: milestone rewards are on hold while the owner redesigns the prizes.
// This module is intentionally not exported from index.ts, so it is not deployed.
// It still uses Gemini (text + TTS); migrate it when the rewards come back.
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenAI, Modality, Type } from "@google/genai";

const region = "southamerica-east1";
const geminiSecret = ["GEMINI_API_KEY"];
const FLASH_LITE_MODEL = "gemini-3.1-flash-lite";
const TTS_MODEL = "gemini-3.1-flash-tts-preview";

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "GEMINI_API_KEY não configurada.");
  }
  return new GoogleGenAI({ apiKey });
};

const requireAuth = (request: { auth?: unknown }) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Apenas usuários logados podem solicitar IA.");
  }
};

type ArtifactKind = "card_marco" | "selo" | "anotacao" | "carta" | "diploma";

const MILESTONE_KIND: Record<number, ArtifactKind> = {
  10: "card_marco",
  20: "selo",
  30: "anotacao",
  40: "carta",
  50: "diploma",
};

const MILESTONE_EIXO: Record<number, string> = {
  10: "chegada com consistência — a aluna se comprometeu e voltou",
  20: "consolidação de hábito — o estudo virou rotina, não esforço pontual",
  30: "amadurecimento do raciocínio — começa a pensar quantitativamente sem perceber",
  40: "autonomia crescente — já lê e questiona em vez de só absorver",
  50: "domínio sustentado — está pronta para aplicar em pesquisa e prática profissional",
};

const PROF_RICARDO_INSTRUCTION = `Você é o Prof. Ricardo, mentor experiente de estatística na área de Nutrição.

REGISTRO E TOM:
- Português brasileiro, registro formal-próximo, voz adulta e madura.
- Você reconhece esforço com palavras escolhidas, sem afeto excessivo, sem exclamações.
- Você fala olhando pra frente — projeta como o conhecimento adquirido se transforma em capacidade real.
- Você é específico sobre o comportamento da aluna (consistência, retorno regular, esforço sustentado), nunca genérico.

REGRAS RÍGIDAS (NÃO QUEBRE):
- NUNCA use "parabéns", "incrível", "fantástico", "excepcional", "continue assim", "você é demais".
- NUNCA faça trocadilhos com estatística (nada de "você é uma constante", "sua média subiu", etc).
- NUNCA use emojis.
- NUNCA use exclamações para reforçar entusiasmo.
- NUNCA repita ideias, palavras-chave ou estruturas de prêmios anteriores que serão fornecidos no contexto.
- NUNCA fale sobre a estatística como matéria (conceitos, fórmulas, distribuições). Fale sobre a aluna e o que esse trabalho representa.
- NUNCA invente fatos sobre a vida da aluna fora do que está no contexto.

O QUE BUSCAR:
- Frases curtas e firmes. Pausas significativas.
- Reconhecimento do comportamento observável (ela voltou, ela completou, ela passou da metade).
- Projeção concreta: raciocínio quantitativo aplicado em leitura crítica de artigos, decisão clínica em nutrição, desenho de estudos, interpretação de resultados de saúde pública.
- Variação de ângulo entre milestones — não repita o mesmo enquadramento.`;

const ARTIFACT_SCHEMAS: Record<ArtifactKind, any> = {
  card_marco: {
    type: Type.OBJECT,
    properties: {
      titulo: { type: Type.STRING, description: "Título curto e sério, 3-5 palavras, sem clichê." },
      reconhecimento: { type: Type.STRING, description: "Uma frase nomeando o comportamento específico que ela demonstrou." },
      corpo: { type: Type.STRING, description: "2-3 frases continuando o reconhecimento, em tom de mentor sênior." },
      projecao: { type: Type.STRING, description: "Uma frase apontando o que isso destrava no futuro dela." },
    },
    required: ["titulo", "reconhecimento", "corpo", "projecao"],
  },
  selo: {
    type: Type.OBJECT,
    properties: {
      titulo_selo: { type: Type.STRING, description: "Nome do selo, sério e contido, ex: 'Selo do Retorno Constante'." },
      virtude_reconhecida: { type: Type.STRING, description: "Uma frase nomeando a virtude observada." },
      principio: { type: Type.STRING, description: "Uma frase enunciando o princípio orientador." },
      convite: { type: Type.STRING, description: "Uma frase de convite ao próximo trecho do trabalho." },
    },
    required: ["titulo_selo", "virtude_reconhecida", "principio", "convite"],
  },
  anotacao: {
    type: Type.OBJECT,
    properties: {
      data_simbolica: { type: Type.STRING, description: "Data atual no formato 'DD de mês de AAAA'." },
      abertura: { type: Type.STRING, description: "Uma frase de abertura da anotação em diário, voz de Prof. Ricardo registrando em caderno." },
      observacao: { type: Type.STRING, description: "2-3 frases registrando o que ele observou no progresso dela." },
      fechamento: { type: Type.STRING, description: "Uma frase de fechamento da anotação, tom reflexivo." },
    },
    required: ["data_simbolica", "abertura", "observacao", "fechamento"],
  },
  carta: {
    type: Type.OBJECT,
    properties: {
      saudacao: { type: Type.STRING, description: "Saudação inicial usando o primeiro nome da aluna." },
      paragrafos: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Exatamente 3 parágrafos. Cada um com 2-4 frases. Cobrem: o que ela demonstrou, o que isso significa, o que vem agora.",
      },
      fecho: { type: Type.STRING, description: "Uma linha de fecho." },
      assinatura: { type: Type.STRING, description: "Sempre 'Prof. Ricardo'." },
    },
    required: ["saudacao", "paragrafos", "fecho", "assinatura"],
  },
  diploma: {
    type: Type.OBJECT,
    properties: {
      titulo_concedido: { type: Type.STRING, description: "Título formal, ex: 'Reconhecimento de Domínio Sustentado em Estatística Básica'." },
      considerando: { type: Type.STRING, description: "Parágrafo formal de fundamentação, começa com 'Considerando que...', 2-3 frases." },
      outorga: { type: Type.STRING, description: "Frase de outorga, ex: 'concede-se a presente distinção...'." },
      data_simbolica: { type: Type.STRING, description: "Data atual no formato 'DD de mês de AAAA'." },
    },
    required: ["titulo_concedido", "considerando", "outorga", "data_simbolica"],
  },
};

const summarizePrevious = (achievements: Record<string, any>): string => {
  const entries = Object.values(achievements || {})
    .filter((a) => a && typeof a === "object")
    .sort((a: any, b: any) => (a.milestone || 0) - (b.milestone || 0));
  if (!entries.length) return "(Nenhum prêmio anterior. Esta é a primeira mensagem do Prof. Ricardo para esta aluna.)";

  return entries
    .map((a: any) => {
      const artifact = a.artifact || {};
      const transcricao = String(a.transcricao || "").slice(0, 280);
      const head =
        artifact.titulo || artifact.titulo_selo || artifact.titulo_concedido || artifact.saudacao || artifact.abertura || `Marco ${a.milestone}`;
      return `- Marco ${a.milestone} (${a.kind}): "${head}"\n  Áudio dito: "${transcricao}"`;
    })
    .join("\n");
};

const summarizeVersions = (previousVersions: any[]): string => {
  if (!Array.isArray(previousVersions) || previousVersions.length === 0) return "";
  const slice = previousVersions.slice(-3);
  return (
    "\n\nVERSÕES JÁ DESCARTADAS DESTE MESMO MARCO (NÃO repita frases nem o mesmo ângulo):\n" +
    slice
      .map((v: any, i: number) => `Versão ${i + 1} dita: "${String(v.transcricao || "").slice(0, 280)}"`)
      .join("\n")
  );
};

// Gemini TTS usually returns raw PCM. If it ever returns WAV directly, keep it intact.
const audioToWav = (audioBase64: string, mimeType = ""): Buffer => {
  const audio = Buffer.from(audioBase64, "base64");
  if (/audio\/(wav|wave)|audio\/x-wav/i.test(mimeType)) {
    return audio;
  }

  const sampleRate = Number(mimeType.match(/rate=(\d+)/i)?.[1] || 24000);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = audio.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, audio]);
};

export const generateAchievementRewardWithGemini = onCall(
  { secrets: geminiSecret, region, timeoutSeconds: 120, memory: "512MiB" },
  async (request) => {
    requireAuth(request);

    const milestone = Number(request.data?.milestone);
    const kind = MILESTONE_KIND[milestone];
    if (!kind) {
      throw new HttpsError("invalid-argument", "Milestone inválido.");
    }

    const userProfile = request.data?.userProfile || {};
    const achievements = request.data?.achievements || {};
    const previousVersions = Array.isArray(request.data?.previousVersions) ? request.data.previousVersions : [];

    const firstName = String(userProfile.name || "Aluna").split(" ")[0];
    const eixo = MILESTONE_EIXO[milestone];
    const previousContext = summarizePrevious(achievements);
    const versionsContext = summarizeVersions(previousVersions);

    const ai = getAi();

    // ---- 1) Gera o artefato (JSON) ----
    const artifactPrompt = `Você vai escrever uma mensagem para a aluna ${firstName}, que acaba de completar ${milestone} exercícios no portal StatAI.

EIXO DE FOCO DESTE MARCO: ${eixo}

CONQUISTAS ANTERIORES DELA (para você NÃO repetir frases, temas nem estrutura):
${previousContext}${versionsContext}

Agora produza o artefato no formato JSON solicitado. Seja específico, sério e direto. Sem clichês. Sem trocadilhos estatísticos. Sem exclamações. A aluna é estudante de Nutrição — o benefício futuro do raciocínio quantitativo está em pesquisa, leitura crítica de artigos, decisão clínica e desenho de estudos. Não fale de fórmulas. Fale do que ela demonstrou e do que isso projeta.`;

    let artifact: any;
    try {
      const artifactResponse = await ai.models.generateContent({
        model: FLASH_LITE_MODEL,
        contents: artifactPrompt,
        config: {
          systemInstruction: PROF_RICARDO_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: ARTIFACT_SCHEMAS[kind],
          temperature: 0.95,
        },
      });
      artifact = JSON.parse(artifactResponse.text || "{}");
    } catch (error) {
      console.error("Erro ao gerar artefato textual:", error);
      throw new HttpsError("internal", "Erro ao gerar a mensagem do Prof. Ricardo.");
    }
    artifact.kind = kind;

    // ---- 2) Gera a transcrição do áudio (texto separado) ----
    const audioPrompt = `Escreva uma mensagem de áudio do Prof. Ricardo para ${firstName}, que completou ${milestone} exercícios.

EIXO DE FOCO: ${eixo}

CONQUISTAS ANTERIORES (NÃO repita frases ou temas):
${previousContext}${versionsContext}

ARTEFATO ESCRITO QUE ELA TAMBÉM VAI VER (NÃO repita esse conteúdo no áudio — complemente):
${JSON.stringify(artifact, null, 2)}

REGRAS DO ÁUDIO:
- Entre 60 e 90 palavras (cerca de 25 segundos falados).
- Prosa corrida, pronta pra ser lida em voz alta. Sem títulos, sem listas, sem marcações de formato.
- Comece chamando ela pelo primeiro nome.
- Tom de mentor sênior falando olhando nos olhos. Pausas implícitas com vírgulas e pontos finais.
- NÃO use exclamações. NÃO use "parabéns", "incrível", nem trocadilhos.
- Complemente o artefato escrito, não repita as mesmas frases.
- Termine com uma frase curta que projeta o próximo trecho do trabalho dela.

Retorne APENAS o texto puro da mensagem, nada mais.`;

    let transcricao = "";
    try {
      const audioTextResponse = await ai.models.generateContent({
        model: FLASH_LITE_MODEL,
        contents: audioPrompt,
        config: {
          systemInstruction: PROF_RICARDO_INSTRUCTION,
          temperature: 0.95,
        },
      });
      transcricao = (audioTextResponse.text || "").trim().replace(/^["']|["']$/g, "");
    } catch (error) {
      console.error("Erro ao gerar transcrição:", error);
      throw new HttpsError("internal", "Erro ao gerar transcrição do áudio.");
    }

    if (!transcricao) {
      throw new HttpsError("internal", "Transcrição vazia retornada pela IA.");
    }

    // ---- 3) Gera o áudio via TTS ----
    let audioBase64 = "";
    let audioMimeType = "";
    try {
      const ttsResponse = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [
          {
            parts: [
              {
                text: `Read warmly but seriously, like an experienced professor speaking to a student he has been watching grow. Brazilian Portuguese, unhurried pace, slight gravity in the voice. Pause naturally at periods.\n\n${transcricao}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Charon" },
            },
          },
        },
      });

      const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inlineData?.data
      );
      audioBase64 = audioPart?.inlineData?.data || "";
      audioMimeType = audioPart?.inlineData?.mimeType || "";
    } catch (error) {
      console.error("Erro ao gerar áudio TTS:", error);
      throw new HttpsError("internal", "Erro ao gerar áudio do Prof. Ricardo.");
    }

    if (!audioBase64) {
      throw new HttpsError("internal", "Áudio vazio retornado pela IA.");
    }

    const wavBuffer = audioToWav(audioBase64, audioMimeType);
    const audioWavBase64 = wavBuffer.toString("base64");

    return {
      milestone,
      kind,
      artifact,
      transcricao,
      audioWavBase64,
    };
  }
);
