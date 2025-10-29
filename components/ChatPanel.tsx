import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Lesson, Exercise, ChatMessage, ChatSessionCache } from '../types';
import { createChatSession, generateExercise } from '../services/geminiService';
import Loader from './Loader';
import { CheckCircleIcon, PaperAirplaneIcon, SparklesIcon, UserIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatPanelProps {
  lesson: Lesson | null;
  onSaveExercise: (newExercise: Omit<Exercise, 'id'>) => void;
  onSaveExercises: (newExercises: Omit<Exercise, 'id'>[]) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ lesson, onSaveExercise }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestExercise, setLatestExercise] = useState<Omit<Exercise, 'id'> | null>(null);
  const chatSessionCache = useRef<ChatSessionCache>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const getChatSession = useCallback((lessonId: string, lessonTitle: string): Chat => {
    if (!chatSessionCache.current[lessonId]) {
      chatSessionCache.current[lessonId] = createChatSession(lessonTitle);
    }
    return chatSessionCache.current[lessonId];
  }, []);
  
  useEffect(() => {
    if (lesson) {
      setMessages([]);
      setLatestExercise(null);
      const welcomeMessage: ChatMessage = {
        role: 'model',
        content: `Olá! Estou pronto para criar exercícios sobre **${lesson.title}**. Você pode me dar uma instrução, como "crie um exercício sobre média e mediana", ou simplesmente clique em "Gerar Exercício" para começar.`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [lesson]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (prompt?: string) => {
    const messageContent = prompt || input;
    if (!messageContent.trim() || !lesson) return;

    setIsLoading(true);
    setInput('');
    setLatestExercise(null);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const chat = getChatSession(lesson.id, lesson.title);
      const result = await generateExercise(chat, lesson.title, lesson.exercises, messageContent);

      if (typeof result === 'string') {
        const modelMessage: ChatMessage = { role: 'model', content: result, timestamp: Date.now() + 1 };
        setMessages(prev => [...prev, modelMessage]);
      } else {
        const newExercise = result as Omit<Exercise, 'id'>;
        const modelMessage: ChatMessage = { role: 'model', content: { ...newExercise, id: 'preview' }, timestamp: Date.now() + 1 };
        setMessages(prev => [...prev, modelMessage]);
        setLatestExercise(newExercise);
      }
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', content: 'Desculpe, ocorreu um erro.', timestamp: Date.now() + 1 };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (latestExercise && lesson) {
        onSaveExercise(latestExercise);
        setLatestExercise(null);
        const confirmationMessage: ChatMessage = {
            role: 'model',
            content: '✅ Exercício salvo com sucesso! Pronto para criar o próximo.',
            timestamp: Date.now(),
            actions: [
                { 
                    label: 'Gerar Exercício Semelhante', 
                    handler: () => handleSendMessage('Gere um exercício com o mesmo tópico, mas com um nível de dificuldade ou tipo diferente para complementar o anterior.') 
                }
            ]
        }
        setMessages(prev => [...prev, confirmationMessage]);
    }
  }

  const renderMessageContent = (content: ChatMessage['content']) => {
    if (typeof content === 'string') {
        return (
            <div className="text-sm text-[--text-primary] prose max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
        );
    }
    
    const exercise = content as Exercise;
    return (
        <div className="bg-[--bg-card] p-4 rounded-lg border border-[--border-color] space-y-2">
            <h4 className="font-semibold text-slate-800">Prévia do Exercício</h4>
             <div className="text-sm prose max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.problemStatement}</ReactMarkdown>
            </div>
            <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 rounded-md"><strong>Dificuldade:</strong> {exercise.difficulty}</span>
                <span className="px-2 py-1 bg-slate-100 rounded-md"><strong>Tipo:</strong> {exercise.type}</span>
            </div>
            <p className="text-slate-700 text-sm pt-2 border-t border-[--border-color]"><strong className="font-medium text-slate-800">Dica:</strong> {exercise.solution.hint}</p>
        </div>
    );
  };

  if (!lesson) {
    return (
      <div className="w-full md:w-1/3 lg:w-2/5 border-l border-[--border-color] bg-[--bg-card] flex flex-col h-full">
      </div>
    );
  }

  return (
    <div className="w-full bg-[--bg-card] flex flex-col h-full">
       <div className="p-4 border-b border-[--border-color] bg-slate-50 flex-shrink-0">
          <h2 className="text-base font-bold text-[--text-primary] flex items-center gap-2">
            <SparklesIcon />
            Gerador de Exercícios com IA
          </h2>
          <p className="text-xs text-[--text-secondary] mt-1 pl-7">
            Use esta área para criar e refinar os exercícios da aula.
          </p>
      </div>

      <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-[--bg-main]">
        {messages.map(msg => (
          <div key={msg.timestamp} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 shadow-sm"><SparklesIcon className="w-5 h-5"/></div>}
            <div className={`w-full max-w-md p-3 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-[--bg-user-message] text-[--text-user-message] rounded-br-none' : 'bg-[--bg-card] border border-[--border-color] text-[--text-primary] rounded-bl-none'}`}>
              {renderMessageContent(msg.content)}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[--border-color] flex flex-wrap gap-2">
                    {msg.actions.map((action, index) => (
                        <button 
                            key={index}
                            onClick={action.handler}
                            disabled={isLoading}
                            className="bg-[--accent-light] text-[--accent] px-3 py-1 text-xs font-semibold rounded-full hover:bg-[--accent-light-hover] transition-colors disabled:bg-slate-200 disabled:text-slate-500"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm"><UserIcon className="w-5 h-5"/></div>}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 shadow-sm"><SparklesIcon className="w-5 h-5"/></div>
                <div className="max-w-md p-3 rounded-xl bg-[--bg-card] border border-[--border-color] rounded-bl-none">
                    <Loader />
                </div>
            </div>
        )}
      </div>

      <div className="p-4 border-t border-[--border-color] bg-[--bg-card] flex-shrink-0">
        {latestExercise && (
             <div className="mb-3 flex items-center gap-3">
                 <button onClick={handleSave} className="flex-1 bg-green-600 text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <CheckCircleIcon /> Salvar Exercício
                </button>
                <button onClick={() => handleSendMessage('Faça um ajuste no enunciado, por favor.')} className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 text-sm font-semibold rounded-lg hover:bg-slate-300 transition-colors shadow-sm">
                    Ajustar
                </button>
             </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSendMessage('Gere um novo exercício.')}
            disabled={isLoading}
            className="bg-[--accent] text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-[--accent-hover] transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            <SparklesIcon /> Gerar
          </button>
          <div className="relative flex-1">
             <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ou refine com uma instrução..."
              disabled={isLoading}
              className="w-full pl-4 pr-10 py-2 border border-[--border-color] rounded-lg focus:ring-2 focus:ring-[--accent] focus:border-[--accent] transition-colors text-sm disabled:bg-slate-100 shadow-sm"
            />
            <button onClick={() => handleSendMessage()} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-[--accent] disabled:text-slate-300">
                <PaperAirplaneIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
