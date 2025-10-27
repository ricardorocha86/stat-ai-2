import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, Exercise, StudentChatMessage, StudentProgress, StructuredLesson } from '../types';
import { Chat } from '@google/genai';
import { createStudentChatSession, sendStudentChatMessage, evaluateStudentAnswer } from '../services/geminiService';
import { BookOpenIcon, PaperAirplaneIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, OwlIcon, PencilSquareIcon, XMarkIcon } from './Icons';
import Loader from './Loader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fireConfetti } from './Confetti';
import InteractiveMaterial from './InteractiveMaterial';

// --- Student Exercise Card ---
interface StudentExerciseCardProps {
    exercise: Exercise;
    index: number;
    isCompleted: boolean;
    onComplete: () => void;
}

const StudentExerciseCard: React.FC<StudentExerciseCardProps> = ({ exercise, index, isCompleted, onComplete }) => {
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | 'partial' | 'error', message: string} | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [solutionStep, setSolutionStep] = useState<'none' | 'hint' | 'guide' | 'full'>('none');

    // Reset state when exercise changes
    useEffect(() => {
        setAnswer('');
        setFeedback(null);
        setIsChecking(false);
        setSolutionStep('none');
    }, [exercise.id]);

    const handleCheckAnswer = async () => {
        if (!answer.trim()) {
            setFeedback({ type: 'error', message: 'Por favor, digite sua resposta antes de verificar.' });
            return;
        }
        setIsChecking(true);
        setFeedback(null);
        const result = await evaluateStudentAnswer(answer, exercise.solution);
        const [status, ...rest] = result.split('\n');
        const feedbackMessage = rest.join('\n');

        if (status.includes('Correto')) {
            setFeedback({ type: 'correct', message: feedbackMessage });
            fireConfetti();
            if (!isCompleted) {
                onComplete();
            }
        } else if (status.includes('Incorreto')) {
            setFeedback({ type: 'incorrect', message: feedbackMessage });
        } else if (status.includes('Parcialmente')) {
            setFeedback({ type: 'partial', message: feedbackMessage });
        } else {
            setFeedback({ type: 'error', message: feedbackMessage });
        }
        setIsChecking(false);
    }
    
    const feedbackColorMap = {
        correct: 'border-green-500 bg-green-50 text-green-800',
        incorrect: 'border-red-500 bg-red-50 text-red-800',
        partial: 'border-yellow-500 bg-yellow-50 text-yellow-800',
        error: 'border-slate-500 bg-slate-100 text-slate-800',
    }
    const feedbackTitleMap = {
        correct: '🎉 Resposta Correta!',
        incorrect: '🤔 Quase lá!',
        partial: '👍 Bom Começo!',
        error: '⚠️ Ops!',
    }
    const feedbackIconMap = {
        correct: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
        incorrect: <XCircleIcon className="w-5 h-5 text-red-600" />,
        partial: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
        error: <ExclamationTriangleIcon className="w-5 h-5 text-slate-600" />,
    }

    return (
        <div className="bg-[--bg-card] p-5 rounded-lg border border-[--border-color] shadow-sm relative">
            {isCompleted && (
                 <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold ring-1 ring-green-200">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Completo</span>
                </div>
            )}
            <h3 className="font-bold text-lg text-[--text-primary] mb-2">Exercício {index + 1} 🎯</h3>
            <div className="text-[--text-secondary] text-sm prose max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 mb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.problemStatement}</ReactMarkdown>
            </div>
            
            <textarea 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                className="w-full p-2 border border-[--border-color] rounded-md text-sm focus:ring-2 focus:ring-[--accent] shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                rows={4}
                disabled={isChecking || isCompleted}
            />

            <div className="flex items-center justify-between mt-3">
                <div>
                    {solutionStep === 'none' && !isCompleted && (
                        <button onClick={() => setSolutionStep('hint')} className="text-[--accent] hover:underline font-medium text-sm">
                            Precisa de uma dica?
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isCompleted && (
                        <button
                            onClick={() => {
                                onComplete();
                                fireConfetti();
                            }}
                            className="bg-[--accent-light] text-[--accent] px-4 py-1.5 text-xs font-semibold rounded-md hover:bg-[--accent-light-hover] transition-colors"
                            title="Marcar este exercício como concluído sem verificar a resposta."
                        >
                            Concluir
                        </button>
                    )}
                    <button 
                        onClick={handleCheckAnswer}
                        disabled={isChecking || isCompleted}
                        className="bg-[--bg-secondary-action] text-[--text-secondary-action] px-4 py-1.5 text-xs font-semibold rounded-md hover:bg-[--bg-secondary-action-hover] transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isChecking ? <Loader /> : isCompleted ? 'Verificado ✓' : 'Verificar Resposta'}
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`mt-4 p-3 border-l-4 rounded-r-md ${feedbackColorMap[feedback.type]}`}>
                    <div className="flex items-center gap-2">
                        {feedbackIconMap[feedback.type]}
                        <h4 className="font-semibold text-sm text-slate-800">{feedbackTitleMap[feedback.type]}</h4>
                    </div>
                    <div className="text-sm text-slate-700 mt-1 pl-7 prose max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback.message}</ReactMarkdown>
                    </div>
                </div>
            )}
            
            {solutionStep !== 'none' && (
                <div className="mt-4 pt-4 border-t border-[--border-color] text-sm space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {solutionStep === 'hint' && (
                            <button onClick={() => setSolutionStep('guide')} className="text-[--accent] hover:underline font-medium">Precisa de mais ajuda?</button>
                        )}
                        {(solutionStep === 'hint' || solutionStep === 'guide') && (
                            <button onClick={() => setSolutionStep('full')} className="text-[--text-secondary] hover:text-[--text-primary] hover:underline text-xs">Ver solução completa</button>
                        )}
                    </div>

                    <div className="p-3 bg-[--bg-main] rounded-md border border-[--border-color] space-y-3 prose max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-sm">
                        <div>
                            <h4 className="font-semibold text-slate-800 not-prose">Dica</h4>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.solution.hint}</ReactMarkdown>
                        </div>
                        {(solutionStep === 'guide' || solutionStep === 'full') && (
                            <div className="pt-2 border-t border-[--border-color]">
                                <h4 className="font-semibold text-slate-800 not-prose">Guia Inicial</h4>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.solution.startingGuide}</ReactMarkdown>
                            </div>
                        )}
                            {(solutionStep === 'full') && (
                            <div className="pt-2 border-t border-[--border-color]">
                                <h4 className="font-semibold text-slate-800 not-prose">Solução Completa</h4>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.solution.fullSolution}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Student Chat Panel ---
const StudentChatPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<StudentChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = async () => {
            setIsLoading(true);
            const session = createStudentChatSession();
            chatSession.current = session;
            const welcomeMessage = await sendStudentChatMessage(session, "Olá, qual sua dúvida?");
            setMessages([{ role: 'model', content: welcomeMessage, timestamp: Date.now() }]);
            setIsLoading(false);
        };
        initChat();
    }, []);

     useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !chatSession.current) return;

        const userMessage: StudentChatMessage = { role: 'user', content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const modelResponse = await sendStudentChatMessage(chatSession.current, input);
        const modelMessage: StudentChatMessage = { role: 'model', content: modelResponse, timestamp: Date.now() + 1 };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    return (
        <div className="w-full bg-[--bg-card] flex flex-col h-full">
             <div className="p-4 border-b border-[--border-color] flex items-center justify-between gap-3 bg-slate-50 flex-shrink-0">
                <div className='flex items-center gap-3'>
                    <div className="w-12 h-12 flex-shrink-0 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center">
                        <OwlIcon className="w-8 h-8"/>
                    </div>
                    <div>
                        <h2 className="font-bold text-[--text-primary]">Stat, o Sábio Coruja</h2>
                        <p className="text-xs text-[--text-secondary]">Seu tutor de estatística. Sarcástico, mas brilhante.</p>
                    </div>
                </div>
                 {onClose && (
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
            <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-[--bg-main]">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 shadow-sm"><SparklesIcon className="w-5 h-5"/></div>}
                         <div className={`w-full max-w-md p-3 rounded-xl shadow-sm prose prose-sm prose-p:my-0.5 ${msg.role === 'user' ? 'bg-[--bg-user-message] text-[--text-user-message]' : 'bg-[--bg-card] border border-[--border-color]'}`}>
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                         </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 shadow-sm"><SparklesIcon className="w-5 h-5"/></div>
                        <div className="max-w-md p-3 rounded-xl bg-[--bg-card] border border-[--border-color]">
                            <Loader />
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-[--border-color] bg-[--bg-card] flex-shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                         type="text"
                         value={input}
                         onChange={e => setInput(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                         placeholder="Faça uma pergunta..."
                         disabled={isLoading}
                         className="w-full pl-4 pr-10 py-2 border border-[--border-color] rounded-lg focus:ring-2 focus:ring-[--accent] focus:border-[--accent] transition-colors text-sm disabled:bg-slate-100 shadow-sm"
                       />
                       <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-[--accent] disabled:text-slate-300">
                           <PaperAirplaneIcon className="w-5 h-5"/>
                       </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Student View ---
interface StudentViewProps {
    lesson: Lesson | null;
    studentProgress: StudentProgress;
    onCompleteExercise: (lessonId: string, exerciseId: string) => void;
    interactiveMaterial: StructuredLesson | null;
    onSetInteractiveMaterial: (content: StructuredLesson) => void;
    onClearInteractiveMaterial: () => void;
}
const StudentView: React.FC<StudentViewProps> = ({ lesson, studentProgress, onCompleteExercise, interactiveMaterial, onSetInteractiveMaterial, onClearInteractiveMaterial }) => {
  const [activeTab, setActiveTab] = useState<'exercises' | 'interactive'>('exercises');
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!lesson) {
    return (
      <main className="flex flex-1 overflow-hidden items-center justify-center text-center p-8">
         <div>
            <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="text-2xl font-bold text-[--text-primary] mt-4">Selecione uma aula</h2>
            <p className="text-[--text-secondary] mt-1 max-w-md">Escolha uma aula na barra lateral para começar a praticar e aprimorar seus conhecimentos em estatística.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden h-full bg-[--bg-main]">
        <div className="flex-shrink-0 px-6 lg:px-8 py-3 border-b border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setActiveTab('exercises')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                        activeTab === 'exercises'
                        ? 'bg-[--accent] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <PencilSquareIcon className="w-5 h-5" />
                    Exercícios
                </button>
                <button
                    onClick={() => setActiveTab('interactive')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                        activeTab === 'interactive'
                        ? 'bg-[--accent] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <SparklesIcon className="w-5 h-5" />
                    Material Interativo
                </button>
            </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'exercises' ? (
          <div className="h-full relative">
              <div className="p-6 lg:p-8 bg-transparent overflow-y-auto h-full">
                  <div className="max-w-4xl mx-auto">
                      {lesson.exercises.length > 0 ? (
                          <div className="space-y-6">
                              {lesson.exercises.map((ex, index) => {
                                  const isCompleted = (studentProgress[lesson.id] || new Set()).has(ex.id);
                                  return (
                                      <StudentExerciseCard 
                                          key={ex.id} 
                                          exercise={ex} 
                                          index={index}
                                          isCompleted={isCompleted}
                                          onComplete={() => onCompleteExercise(lesson.id, ex.id)}
                                      />
                                  );
                              })}
                          </div>
                      ) : (
                          <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-lg bg-white/50">
                              <h3 className="text-lg font-medium text-[--text-primary]">Ainda não há exercícios.</h3>
                              <p className="mt-1 text-sm text-[--text-secondary]">Peça ao seu professor para gerar alguns exercícios para esta aula.</p>
                          </div>
                      )}
                  </div>
              </div>
              
              {/* Unified FAB to open chat */}
              <button
                  onClick={() => setIsChatOpen(true)}
                  className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-xl z-20 hover:bg-blue-700 transition-transform transform hover:scale-110"
                  aria-label="Abrir chat com tutor"
              >
                  <OwlIcon className="w-8 h-8"/>
              </button>

              {/* Unified Chat Modal/Overlay */}
              {isChatOpen && (
                  <div 
                      className="fixed inset-0 bg-black/60 z-40 flex flex-col justify-end"
                      onClick={() => setIsChatOpen(false)}
                  >
                      <div 
                          className="bg-slate-50 w-full h-[80vh] rounded-t-2xl shadow-2xl flex flex-col animate-slide-up"
                          onClick={(e) => e.stopPropagation()}
                      >
                          <StudentChatPanel onClose={() => setIsChatOpen(false)} />
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
        ) : (
          <InteractiveMaterial 
              lesson={lesson} 
              interactiveMaterial={interactiveMaterial}
              onSetInteractiveMaterial={onSetInteractiveMaterial}
              onClearInteractiveMaterial={onClearInteractiveMaterial}
          />
        )}
      </div>
    </main>
  );
};

export default StudentView;
