import React, { useState, useRef, useEffect } from 'react';
import { Lesson, GenerationOptions, QAMessage, StructuredLesson } from '../types';
import { generateInteractiveLesson, answerQuestionAboutLesson } from '../services/geminiService';
import { SparklesIcon, PaperAirplaneIcon, UserIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon, DownloadIcon, OwlIcon, XMarkIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface InteractiveMaterialProps {
  lesson: Lesson;
  interactiveMaterial: StructuredLesson | null;
  onSetInteractiveMaterial: (content: StructuredLesson) => void;
  onClearInteractiveMaterial: () => void;
}

const loadingMessages = [
    "Consultando os grandes mestres da estatística...",
    "Organizando os bytes do conhecimento...",
    "Polindo os exemplos para ficarem brilhantes...",
    "Calibrando os algoritmos de aprendizado...",
    "Destilando sabedoria em formato digital...",
    "Quase lá! Preparando os questionamentos para reflexão...",
];

const CustomLoader: React.FC<{ time: number, message: string }> = ({ time, message }) => (
    <div className="text-center p-8 bg-slate-50 rounded-xl">
        <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 10 C 30 10, 20 40, 20 60 S 30 110, 60 110 C 90 110, 100 80, 100 60 S 90 10, 60 10 Z" fill="none" stroke="#90cdf4" strokeWidth="3"/>
            <path d="M60,10 C 40,10 30,40 35,60 S 40,110 60,110" fill="#63b3ed" stroke="none">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M60,10 C 80,10 90,40 85,60 S 80,110 60,110" fill="#63b3ed" stroke="none">
                 <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin="1s" repeatCount="indefinite" />
            </path>
            <line x1="60" y1="10" x2="60" y2="110" stroke="#90cdf4" strokeWidth="2"/>
        </svg>
        <p className="mt-4 text-slate-700 font-semibold text-lg">
            Gerando seu material personalizado...
        </p>
        <div className="mt-2 text-slate-500 min-h-[40px] flex items-center justify-center">
            <p className="transition-opacity duration-500">{message}</p>
        </div>
        <p className="mt-2 text-slate-400 font-mono text-sm">
            Tempo decorrido: {time}s
        </p>
    </div>
);

const InteractiveMaterial: React.FC<InteractiveMaterialProps> = ({ lesson, interactiveMaterial, onSetInteractiveMaterial, onClearInteractiveMaterial }) => {
  const [options, setOptions] = useState<GenerationOptions>({
    focus: '',
    length: 'médio',
    level: 'intermediário',
    useEmojis: true,
  });
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const qaChatContainerRef = useRef<HTMLDivElement>(null);
  const [isQaChatOpen, setIsQaChatOpen] = useState(false);

  useEffect(() => {
    // When the lesson changes, reset error and close chat, but don't clear content
    // The parent component (`App.tsx`) controls the content persistence.
    setError(null);
    setIsQaChatOpen(false);
    setUserQuestion('');
  }, [lesson]);

  useEffect(() => {
    if (interactiveMaterial) {
        const finalHtml = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${lesson.title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 800px; margin: 20px auto; padding: 0 20px; background-color: #ffffff; }
                    h1, h2, h3 { color: #1e293b; } 
                    h1 { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 2.2em; margin-bottom: 20px; }
                    h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 40px; font-size: 1.7em; }
                    p { margin-bottom: 1em; }
                    code { background-color: #f1f5f9; color: #1e293b; padding: 3px 6px; border-radius: 4px; font-family: Consolas, 'Courier New', Courier, monospace; font-size: 0.9em; }
                    pre { background-color: #f1f5f9; padding: 15px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; overflow-x: auto; }
                    blockquote { border-left: 4px solid #9ca3af; padding-left: 15px; color: #475569; font-style: italic; margin-left: 0; }
                    ul, ol { padding-left: 25px; }
                    .section { margin-bottom: 30px; }
                    #questionamentos-section ul { list-style-type: none; padding-left: 0; }
                    #questionamentos-section li { background-color: #eff6ff; border-left: 5px solid #3b82f6; margin-bottom: 10px; padding: 15px; border-radius: 0 5px 5px 0; }
                </style>
            </head>
            <body>
                <h1>${lesson.title}</h1>
                <div class="section">
                    <h2>✨ Introdução</h2>
                    ${interactiveMaterial.introducao}
                </div>
                <div class="section">
                    <h2>📚 Teoria</h2>
                    ${interactiveMaterial.teoria}
                </div>
                <div class="section">
                    <h2>💡 Exemplos</h2>
                    ${interactiveMaterial.exemplos}
                </div>
                <div id="questionamentos-section" class="section">
                    <h2>🤔 Questionamentos para Reflexão</h2>
                    ${interactiveMaterial.questionamentos}
                </div>
            </body>
            </html>
        `;
        setGeneratedHtml(finalHtml);
        setQaMessages([
          { role: 'model', content: `Ora, ora... parece que você gerou um material sobre **${lesson.title}**. Se sua mente pequena tiver alguma dúvida sobre o que eu preparei, pode perguntar. Mas seja breve.` }
        ]);
    } else {
        setGeneratedHtml(null);
    }
  }, [interactiveMaterial, lesson.title]);
  
  useEffect(() => {
    if (qaChatContainerRef.current) {
        qaChatContainerRef.current.scrollTop = qaChatContainerRef.current.scrollHeight;
    }
  }, [qaMessages]);

  useEffect(() => {
    let timerInterval: number;
    let messageInterval: number;

    if (isGenerating) {
        setTimer(0);
        setLoadingMessage(loadingMessages[0]);
        let messageIndex = 0;

        timerInterval = window.setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);

        messageInterval = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 5000);
    }

    return () => {
        clearInterval(timerInterval);
        clearInterval(messageInterval);
    };
}, [isGenerating]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateInteractiveLesson(lesson.title, options);
      if (typeof result === 'string') {
        setError(result);
      } else {
        onSetInteractiveMaterial(result);
      }
    } catch (e: any) {
      setError("Ocorreu um erro ao gerar o material. Por favor, tente novamente.");
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${lesson.title.replace(/[\s/]/g, '_')}.html`);
    // Append to body is required for firefox
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleAskQuestion = async () => {
    if (!userQuestion.trim() || !interactiveMaterial) return;
    const fullLessonText = Object.values(interactiveMaterial).join('\n\n');

    const newMessages: QAMessage[] = [...qaMessages, { role: 'user', content: userQuestion }];
    setQaMessages(newMessages);
    setUserQuestion('');
    setIsAnswering(true);

    try {
      const answer = await answerQuestionAboutLesson(fullLessonText, userQuestion);
      setQaMessages([...newMessages, { role: 'model', content: answer }]);
    } catch (e) {
      setQaMessages([...newMessages, { role: 'model', content: "Francamente, até meus circuitos se confundiram com sua pergunta. Tente de novo, talvez com mais clareza." }]);
      console.error(e);
    } finally {
      setIsAnswering(false);
    }
  };

  const renderGenerationForm = () => (
    <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
            <div className="text-center">
                <SparklesIcon className="w-12 h-12 mx-auto text-blue-500 bg-blue-100 p-2 rounded-full" />
                <h2 className="text-2xl font-bold text-slate-800 mt-4">Gerador de Material de Aula</h2>
                <p className="text-slate-600 mt-1">Personalize sua experiência de aprendizado sobre "{lesson.title}".</p>
            </div>
            
            <div className="mt-8 space-y-6">
                <div>
                    <label htmlFor="focus" className="block text-sm font-medium text-slate-700 mb-1">Área de Foco (Opcional)</label>
                    <input
                        type="text"
                        id="focus"
                        value={options.focus}
                        onChange={(e) => setOptions({...options, focus: e.target.value })}
                        placeholder="Ex: finanças, saúde, esportes..."
                        className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Peça exemplos aplicados a uma área de seu interesse.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="length" className="block text-sm font-medium text-slate-700 mb-1">Tamanho do Texto</label>
                        <select id="length" value={options.length} onChange={(e) => setOptions({...options, length: e.target.value as any})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="curto">Curto</option>
                            <option value="médio">Médio</option>
                            <option value="longo">Longo</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-1">Nível de Linguagem</label>
                        <select id="level" value={options.level} onChange={(e) => setOptions({...options, level: e.target.value as any})} className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="iniciante">Iniciante</option>
                            <option value="intermediário">Intermediário</option>
                            <option value="avançado">Avançado</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                            type="checkbox"
                            checked={options.useEmojis}
                            onChange={(e) => setOptions({...options, useEmojis: e.target.checked})}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Usar Emojis para ilustrar? 🤓
                    </label>
                </div>
            </div>
            
            <div className="mt-8">
                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400"
                >
                    {isGenerating ? 'Gerando...' : <><SparklesIcon /> Gerar Material</>}
                </button>
            </div>
        </div>
    </div>
  );

  const renderGeneratedContent = () => (
    <div className="flex flex-1 flex-col overflow-hidden h-full bg-slate-100 relative">
        {/* Main content: iframe */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Seu Material de Aula Personalizado</h3>
                <div className="flex items-center gap-2">
                     <button
                        onClick={onClearInteractiveMaterial}
                        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
                    >
                        <SparklesIcon className="w-4 h-4" /> Gerar Novo
                    </button>
                    <button
                        onClick={handleDownloadHtml}
                        className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <DownloadIcon className="w-4 h-4" /> Baixar HTML
                    </button>
                </div>
            </div>
            <iframe
                srcDoc={generatedHtml || ''}
                title="Material de Aula"
                className="flex-1 w-full h-full border-0 bg-white"
            />
        </div>

        {/* FAB to open chat */}
        <button
            onClick={() => setIsQaChatOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-xl z-20 hover:bg-blue-700 transition-transform transform hover:scale-110"
            aria-label="Abrir chat com tutor"
        >
            <OwlIcon className="w-8 h-8"/>
        </button>

        {/* Chat Modal/Overlay */}
        {isQaChatOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-40 flex flex-col justify-end"
                onClick={() => setIsQaChatOpen(false)}
            >
                <div 
                    className="bg-slate-50 w-full h-[80vh] rounded-t-2xl shadow-2xl flex flex-col animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex-shrink-0 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center">
                                <OwlIcon className="w-8 h-8"/>
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">Stat, o Sábio Coruja</h2>
                                <p className="text-xs text-slate-600">Dúvidas sobre o material gerado? Pergunte.</p>
                            </div>
                        </div>
                        <button onClick={() => setIsQaChatOpen(false)} className="p-1 text-slate-500 hover:text-slate-800">
                           <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div ref={qaChatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-100">
                        {qaMessages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 shadow-sm"><SparklesIcon className="w-5 h-5"/></div>}
                                <div className={`w-full max-w-md p-3 rounded-xl shadow-sm prose prose-sm prose-p:my-0.5 ${msg.role === 'user' ? 'bg-[--bg-user-message] text-[--text-user-message]' : 'bg-[--bg-card] border border-[--border-color]'}`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm"><UserIcon className="w-5 h-5"/></div>}
                            </div>
                        ))}
                        {isAnswering && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 shadow-sm"><SparklesIcon className="w-5 h-5"/></div>
                                <div className="max-w-md p-3 rounded-xl bg-white border border-slate-200 flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={userQuestion}
                                onChange={(e) => setUserQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                                placeholder="Faça uma pergunta..."
                                disabled={isAnswering}
                                className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <button onClick={handleAskQuestion} disabled={isAnswering || !userQuestion.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-600 disabled:text-slate-300">
                                <PaperAirplaneIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </div>
                <style>{`
                  @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                  }
                  .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
                `}</style>
            </div>
        )}
    </div>
  );
  
  if (isGenerating) {
    return (
        <div className="flex h-full items-center justify-center text-center p-8">
            <CustomLoader time={timer} message={loadingMessage} />
        </div>
    );
  }

  if (error) {
     return (
      <div className="flex h-full items-center justify-center text-center p-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800">Erro ao Gerar Material</h3>
          <p className="text-sm text-red-700 mt-2">{error}</p>
           <button onClick={() => {setError(null); handleGenerate()}} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return interactiveMaterial ? renderGeneratedContent() : renderGenerationForm();
};

export default InteractiveMaterial;
