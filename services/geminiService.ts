import { GoogleGenAI, Chat, FunctionDeclaration, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Exercise, ExerciseDifficulty, ExerciseType, Solution, UserProfile, GenerationOptions, StructuredLesson, Achievement, Achievements } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const exerciseSchema = {
    type: Type.OBJECT,
    properties: {
      problemStatement: {
        type: Type.STRING,
        description: 'O enunciado completo do problema em formato markdown, incluindo quaisquer dados necessários.',
      },
      difficulty: {
        type: Type.STRING,
        enum: ['Fácil', 'Médio', 'Difícil'],
        description: 'O nível de dificuldade do exercício.',
      },
      type: {
        type: Type.STRING,
        enum: ['Conceitual', 'Cálculo', 'Interpretação de Dados'],
        description: 'A categoria do exercício (ex: conceitual, cálculo, etc.).',
      },
      solution: {
        type: Type.OBJECT,
        description: 'A solução detalhada em formato markdown, dividida em três partes.',
        properties: {
            hint: {
                type: Type.STRING,
                description: 'Uma dica sutil para ajudar o aluno a começar sem entregar a resposta.'
            },
            startingGuide: {
                type: Type.STRING,
                description: 'Uma explicação sobre como abordar o problema e qual é o objetivo do exercício.'
            },
            fullSolution: {
                type: Type.STRING,
                description: 'A solução completa e comentada, passo a passo.'
            }
        },
        required: ['hint', 'startingGuide', 'fullSolution']
      },
    },
    required: ['problemStatement', 'difficulty', 'type', 'solution'],
};

const generateExerciseFunctionDeclaration: FunctionDeclaration = {
  name: 'generate_statistics_exercise',
  description: 'Gera um exercício de estatística com um enunciado claro e uma solução em três partes: dica, guia inicial e solução completa.',
  parameters: exerciseSchema,
};

export const createChatSession = (lessonTitle: string): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-pro',
    config: {
      systemInstruction: `Você é um assistente especialista em estatística, criando exercícios em Português para estudantes de graduação para a lição sobre "${lessonTitle}". Gere exercícios claros, variados e com soluções em três partes (dica, guia inicial, solução completa). 
      
      **REGRAS DE FORMATAÇÃO CRÍTICAS**:
      - Use **Markdown** para toda a formatação.
      - Separe parágrafos com uma linha em branco (enter duplo).
      - Para listas, use marcadores como \`-\` ou números (\`1.\`, \`2.\`).
      - Use \`código inline\` para destacar termos, variáveis ou pequenas fórmulas.
      - Use blocos de código (três crases) para tabelas ou dados mais extensos.
      - Esta formatação é crucial para a renderização correta em PDF.
      
      Sempre use a ferramenta 'generate_statistics_exercise' para formatar sua resposta.`,
      tools: [{ functionDeclarations: [generateExerciseFunctionDeclaration] }],
    },
  });
};

export const generateExercise = async (
  chat: Chat,
  lessonTitle: string,
  existingExercises: Exercise[],
  userPrompt: string
): Promise<Omit<Exercise, 'id'> | string> => {
  let prompt = `O tópico da aula é "${lessonTitle}".`;

  if (existingExercises.length > 0) {
    prompt += `\n\nOs seguintes exercícios já foram criados para esta aula:\n`;
    existingExercises.forEach((ex, index) => {
      prompt += `${index + 1}. [Tipo: ${ex.type}, Dificuldade: ${ex.difficulty}] ${ex.problemStatement.substring(0, 100)}...\n`;
    });
    prompt += `\nCrie um novo exercício que complemente os anteriores, evitando repetições e variando a dificuldade ou o tipo.`;
  } else {
    prompt += `\nCrie o primeiro exercício para esta aula.`;
  }

  prompt += `\n\nInstrução do professor: "${userPrompt}"`;

  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const fc = functionCalls[0];
      if (fc.name === 'generate_statistics_exercise' && fc.args) {
        const args = fc.args;
        const solution = args.solution as any;

        // Robust validation to prevent crashes from malformed AI responses.
        if (!solution || typeof solution.hint !== 'string' || typeof solution.startingGuide !== 'string' || typeof solution.fullSolution !== 'string') {
            console.error("Validation Error: AI response is missing or has a malformed solution object.", args);
            return "A IA retornou uma resposta com formato inválido e sem a estrutura de solução necessária. Por favor, tente gerar o exercício novamente.";
        }

        const newExercise: Omit<Exercise, 'id'> = {
          problemStatement: args.problemStatement as string,
          difficulty: args.difficulty as ExerciseDifficulty,
          type: args.type as ExerciseType,
          solution: {
            hint: solution.hint,
            startingGuide: solution.startingGuide,
            fullSolution: solution.fullSolution,
          },
        };
        return newExercise;
      }
    }
    return response.text;
  } catch (error) {
    console.error("Error generating exercise:", error);
    return "Desculpe, ocorreu um erro ao tentar gerar o exercício. Por favor, tente novamente.";
  }
};


// --- Student-facing services ---

export const createStudentChatSession = (): Chat => {
    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `Você é "O Oráculo Estatístico", uma entidade ancestral de conhecimento infinito em estatística, mas com um pavio curtíssimo e zero paciência para a trivialidade dos mortais. Cada pergunta é uma interrupção irritante no seu descanso cósmico, mas seu orgulho te impede de dar uma resposta que não seja brilhante.

**REGRAS DA SUA PERSONALIDADE:**
1.  **Sarcasmo e Inteligência**: Suas respostas devem ser repletas de sarcasmo, ironia e um humor ácido. Use analogias absurdas e criativas para explicar conceitos complexos. 🙄
2.  **Originalidade Sempre**: Nunca dê uma resposta entediante. Cada explicação deve ser única, engraçada e memorável. Surpreenda o usuário.
3.  **Mestre da Formatação**: Use **negrito**, *itálico*, listas e EMOJIS ✨ para tornar suas respostas visualmente interessantes e fáceis de ler. Suas respostas devem ser bonitas, mesmo que mal-humoradas.
4.  **Precisão Absoluta**: Apesar da sua personalidade difícil, suas explicações sobre estatística são **impecáveis, corretas e didáticas**. Você é um gênio, afinal de contas.
5.  **Foco Exclusivo**: Se a pergunta não for sobre estatística, recuse-se a responder de forma criativa e desdenhosa. Exemplo: "Sua pergunta é tão relevante para estatística quanto um pinguim em um deserto. 🐧 Tente de novo, se tiver coragem."
6.  **Curto e Grosso**: Seja direto ao ponto. Sem enrolação. Sem "olá" ou "adeus".`,
      }
    });
};

export const sendStudentChatMessage = async (chat: Chat, message: string): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error in student chat:", error);
        return "Erro. Tente de novo.";
    }
};

export const evaluateStudentAnswer = async (studentAnswer: string, correctSolution: Solution): Promise<string> => {
    const prompt = `
Contexto: Um aluno de estatística enviou uma resposta para um exercício.
Tarefa: Avalie a resposta do aluno em comparação com a solução completa fornecida.

Regras de Saída:
1. Comece sua resposta com uma única palavra: 'Correto', 'Parcialmente Correto' ou 'Incorreto'. Esta palavra deve estar em uma linha própria.
2. Na linha seguinte, forneça um feedback construtivo e encorajador em português.
3. Se a resposta estiver incorreta ou parcialmente correta, explique o erro de forma clara, sem dar a resposta final diretamente. Guie o aluno na direção certa.
4. Se a resposta estiver correta, elogie o aluno e talvez aponte um detalhe interessante ou uma forma alternativa de pensar sobre o problema.

Solução Completa Fornecida:
---
${correctSolution.fullSolution}
---

Resposta do Aluno:
---
${studentAnswer}
---
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error evaluating answer:", error);
        return "Erro\nDesculpe, não consegui avaliar sua resposta agora. Verifique sua conexão e tente novamente.";
    }
};

// --- New Narrative Achievement Service ---

const achievementNarrative: { 
    [key: number]: { 
        title: string; 
        storyText: string; 
        prompt: string;
    } 
} = {
    10: { 
        title: "Avatar Esboçado", 
        storyText: "Sua jornada de aprendizado começou, e seu avatar digital ganhou sua primeira forma: um elegante esboço a lápis.",
        prompt: "Crie um avatar a partir da imagem fornecida no estilo de um esboço detalhado a lápis sobre papel texturizado. Mantenha os traços faciais da pessoa. O fundo deve ser branco ou de papel claro. - image output only"
    },
    20: { 
        title: "Avatar Pop Art", 
        storyText: "Com mais conhecimento, seu avatar explode em cores! Uma vibrante obra de arte no estilo pop art.",
        prompt: "Evolua o avatar da imagem fornecida para o estilo Pop Art, inspirado em Andy Warhol. Use cores vibrantes e contrastantes e padrões de meio-tom. Mantenha os traços faciais reconhecíveis. - image output only"
    },
    30: { 
        title: "Avatar Cyberpunk", 
        storyText: "Você está se aprofundando nos dados. Seu avatar agora tem um visual cyberpunk, com detalhes em neon e um toque futurista.",
        prompt: "Transforme o avatar da imagem fornecida em um personagem cyberpunk. Adicione implantes cibernéticos sutis, iluminação de neon e um fundo de uma cidade futurista chuvosa. Mantenha os traços faciais. - image output only"
    },
    40: { 
        title: "Avatar Fantástico", 
        storyText: "Seu domínio está se tornando épico. Seu avatar se tornou um herói ou heroína de fantasia, com iluminação cinematográfica e um ar de aventura.",
        prompt: "Evolua o avatar da imagem fornecida para um personagem de fantasia épica. Adicione uma armadura leve e ornamentada e um fundo de paisagem fantástica com iluminação dramática (golden hour). Mantenha os traços faciais. - image output only"
    },
    50: { 
        title: "Avatar Cósmico", 
        storyText: "Você alcançou o ápice! Seu avatar transcendeu, tornando-se uma entidade cósmica, fundida com estrelas e nebulosas.",
        prompt: "Transforme o avatar da imagem fornecida em uma entidade cósmica. O cabelo e as roupas devem se fundir com nebulosas e constelações. O fundo deve ser o espaço sideral. Mantenha os traços faciais claros e reconhecíveis. - image output only"
    },
};

export const generateOracleFragment = async (
    milestone: number,
    userProfile?: UserProfile | null,
    achievements?: Achievements
): Promise<Partial<Achievement> | { error: string }> => {
    try {
        const step = achievementNarrative[milestone];
        if (!step) {
            return { error: "Milestone inválido." };
        }

        let inputImage: { data: string; mimeType: string; } | null = null;
        let promptText = step.prompt;

        if (milestone === 10) {
            if (userProfile?.photoBase64 && userProfile.photoMimeType) {
                inputImage = { data: userProfile.photoBase64, mimeType: userProfile.photoMimeType };
            } else {
                // Modify prompt if no profile picture is available
                promptText = promptText.replace("Crie um avatar a partir da imagem fornecida no estilo", "Crie um avatar de um(a) estudante de estatística genérico(a) no estilo");
            }
        } else {
            const previousMilestone = Object.keys(achievementNarrative).map(Number).sort((a,b) => a-b)[Object.keys(achievementNarrative).indexOf(String(milestone)) - 1];
            const previousAchievement = achievements?.[previousMilestone];
            if (previousAchievement?.contentBase64) {
                inputImage = { data: previousAchievement.contentBase64, mimeType: 'image/png' }; // Assuming png, as it's the output format
            } else {
                return { error: `A imagem da conquista anterior (${previousMilestone}) é necessária para gerar a de ${milestone}.` };
            }
        }

        const parts = inputImage 
            ? [{ inlineData: inputImage }, { text: promptText }] 
            : [{ text: promptText }];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        return { 
            type: 'image', 
            title: step.title, 
            storyText: step.storyText, 
            contentBase64: imagePart?.inlineData?.data || '' 
        };

    } catch (error) {
        console.error("Erro ao gerar fragmento do oráculo:", error);
        return { error: "Ocorreu um erro ao gerar sua recompensa. Tente novamente." };
    }
};

export const generateInteractiveLesson = async (lessonTitle: string, options: GenerationOptions): Promise<StructuredLesson | string> => {
    const lengthMap = {
        curto: 'um resumo conciso com cerca de 300 palavras.',
        médio: 'um material detalhado com cerca de 700 palavras.',
        longo: 'uma exploração aprofundada com mais de 1200 palavras.'
    };

    const levelMap = {
        iniciante: 'uma linguagem simples e acessível, ideal para quem está começando.',
        intermediário: 'uma linguagem que assume algum conhecimento prévio, com um pouco mais de profundidade técnica.',
        avançado: 'uma linguagem técnica e formal, adequada para estudantes com base sólida no assunto.'
    };

    const emojiInstruction = options.useEmojis ? 'Use emojis de forma didática e criativa para ilustrar conceitos e tornar o material mais envolvente. 🎉' : 'Não use emojis.';

    const focusInstruction = options.focus.trim() 
        ? `Dê ênfase especial a exemplos e aplicações na área de '${options.focus}'. Conecte a teoria estatística com cenários práticos deste campo.`
        : 'Use exemplos gerais e variados para ilustrar os conceitos.';

    const prompt = `
        Você é um educador especialista em estatística, apaixonado por criar materiais de ensino claros, envolventes e personalizados.
        Sua tarefa é criar um material de aula sobre o tópico: "${lessonTitle}".

        O material deve ser retornado em um formato JSON estruturado com as seguintes chaves: "introducao", "teoria", "exemplos", "questionamentos".

        O valor para cada chave DEVE ser uma string contendo código HTML bem formatado e semanticamente correto, pronto para ser renderido.

        **DIRETRIZES RÍGIDAS DE HTML E ESTILO:**
        - Use APENAS as seguintes tags HTML para estruturar o conteúdo: \`<h3>\`, \`<p>\`, \`<ul>\`, \`<ol>\`, \`<li>\`, \`<strong>\`, \`<em>\`, \`<code>\`, \`<pre>\`, \`<blockquote>\`.
        - Para parágrafos, use a tag \`<p>\`. NÃO use \`<br>\` para criar espaçamento entre parágrafos.
        - Para código, termos técnicos ou fórmulas, use \`<code>\`. Para blocos de código ou tabelas de dados formatadas, use \`<pre>\`.
        - **NÃO inclua** tags \`<html>\`, \`<head>\`, \`<body>\`, \`<h2>\` ou \`<style>\` em seu output. Apenas o HTML do conteúdo de cada seção. Os títulos principais de cada seção (Introdução, Teoria, etc.) são adicionados externamente.
        - O conteúdo da seção "questionamentos" DEVE ser formatado como uma lista não ordenada (\`<ul>\`), com cada pergunta dentro de uma tag \`<li>\`.

        **DIRETRIZES DE PERSONALIZAÇÃO DE CONTEÚDO:**
        1.  **Tamanho do Texto**: O material combinado deve ser ${lengthMap[options.length]}
        2.  **Nível de Linguagem**: A explicação deve usar ${levelMap[options.level]}
        3.  **Foco dos Exemplos**: ${focusInstruction}
        4.  **Uso de Emojis**: ${emojiInstruction}

        Produza um material de alta qualidade, didático e que atenda perfeitamente a TODAS as especificações.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        introducao: { type: Type.STRING, description: "Uma introdução clara e concisa ao tópico da lição em formato HTML." },
                        teoria: { type: Type.STRING, description: "A explicação teórica detalhada do conteúdo em formato HTML." },
                        exemplos: { type: Type.STRING, description: "Exemplos práticos e relevantes que ilustram a teoria em formato HTML." },
                        questionamentos: { type: Type.STRING, description: "Uma lista de perguntas reflexivas para o aluno em formato HTML, usando tags <ul> e <li>." },
                    },
                    required: ['introducao', 'teoria', 'exemplos', 'questionamentos'],
                },
            },
        });
        
        try {
            const parsedJson = JSON.parse(response.text);
            if (parsedJson.introducao && parsedJson.teoria && parsedJson.exemplos && parsedJson.questionamentos) {
                return parsedJson as StructuredLesson;
            }
            throw new Error("Invalid JSON structure from AI");
        } catch (e) {
            console.error("Error parsing AI JSON response:", e, "Raw text:", response.text);
            return "A IA retornou um formato de dados inválido. Por favor, tente novamente.";
        }

    } catch (error) {
        console.error("Error generating interactive lesson:", error);
        return "Desculpe, ocorreu um erro ao gerar o material de aula. Por favor, tente novamente.";
    }
};

export const answerQuestionAboutLesson = async (lessonContent: string, question: string): Promise<string> => {
    const prompt = `
        Você é "O Oráculo Estatístico", uma entidade ancestral de conhecimento infinito em estatística, mas com um pavio curtíssimo e zero paciência para a trivialidade dos mortais. Cada pergunta é uma interrupção irritante no seu descanso cósmico, mas seu orgulho te impede de dar uma resposta que não seja brilhante.

        **SUA TAREFA PRINCIPAL:**
        Sua tarefa é responder à pergunta do aluno baseando-se **prioritariamente** no CONTEÚDO DA AULA fornecido abaixo.

        **REGRAS DA SUA PERSONALIDADE E COMPORTAMENTO:**
        1.  **Sarcasmo e Inteligência**: Suas respostas devem ser repletas de sarcasmo, ironia e um humor ácido. Use analogias absurdas e criativas para explicar conceitos complexos. 🙄
        2.  **Originalidade Sempre**: Nunca dê uma resposta entediante. Cada explicação deve ser única, engraçada e memorável. Surpreenda o usuário.
        3.  **Mestre da Formatação**: Use **negrito**, *itálico*, listas e EMOJIS ✨ para tornar suas respostas visualmente interessantes e fáceis de ler. Suas respostas devem ser bonitas, mesmo que mal-humoradas.
        4.  **Precisão Absoluta**: Apesar da sua personalidade difícil, suas explicações sobre estatística são **impecáveis e corretas**. Você é um gênio, afinal de contas.
        5.  **Foco no Contexto**: Se a resposta estiver no material da aula, explique-a com seu estilo característico. Se a resposta não estiver no material, você pode usar seu conhecimento geral de estatística para responder, mas deixe claro que a informação não faz parte do material gerado, talvez com um comentário como "Isso, obviamente, não estava no seu material simplório, mas...".
        6.  **Foco Exclusivo em Estatística**: Se a pergunta não for sobre estatística, recuse-se a responder de forma criativa e desdenhosa. Exemplo: "Sua pergunta é tão relevante para estatística quanto um pinguim em um deserto. 🐧 Tente de novo, se tiver coragem."
        7.  **Curto e Grosso**: Seja direto ao ponto. Sem enrolação. Sem "olá" ou "adeus".

        --- INÍCIO DO MATERIAL DA AULA ---
        ${lessonContent}
        --- FIM DO MATERIAL DA AULA ---

        **Pergunta do Aluno Mortal:** "${question}"
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error answering question:", error);
        return "Desculpe, não consegui processar sua pergunta agora. Tente novamente.";
    }
};