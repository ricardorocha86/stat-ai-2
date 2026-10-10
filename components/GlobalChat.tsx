import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AiChatSession, StudentChatMessage, UserProfile, ChatbotStyle, Course, Lesson } from '../types';
import { createStudentChatSession, sendStudentChatMessage } from '../services/aiService';
import { OwlIcon, XMarkIcon, PaperAirplaneIcon, BookOpenIcon } from './Icons';
import Loader from './Loader';
import MarkdownRenderer from './MarkdownRenderer';

const ArrowPathIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

interface GlobalChatProps {
    userProfile?: UserProfile | null;
    course: Course;
    onOpenLesson: (lesson: Lesson) => void;
    // A question asked elsewhere in the app (home page); the chat opens and sends it.
    question?: { text: string; id: number } | null;
    // The home page content is wider than the other pages; the button sits next to it.
    wideContent?: boolean;
}

const WELCOME_MESSAGES: Record<ChatbotStyle, string> = {
    'Padrão': 'Olá! Sou o Stat, seu assistente de estatística. Qual é a sua dúvida?',
    'Xarope': 'Ah, mais um. Manda logo essa dúvida de estatística, criatura, que meu café está esfriando.',
    'Amiguinho': 'Oiii, estrela mais brilhante do universo! 🥰✨🌟 Que alegria imensa te ver aqui! Qual dúvida maravilhosa vamos resolver juntinhos? 💖',
};

// The student can switch the tutor's tone at any moment of the conversation.
const TONES: { style: ChatbotStyle; emoji: string; label: string }[] = [
    { style: 'Xarope', emoji: '😤', label: 'Xarope (mal-humorado e sem filtro)' },
    { style: 'Padrão', emoji: '🙂', label: 'Padrão' },
    { style: 'Amiguinho', emoji: '🤩', label: 'Amiguinho (bajulador)' },
];

const TONE_EMOJI = Object.fromEntries(TONES.map(tone => [tone.style, tone.emoji])) as Record<ChatbotStyle, string>;

const ToneAvatar: React.FC<{ tone: ChatbotStyle }> = ({ tone }) => (
    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1 text-lg leading-none" aria-hidden="true">
        {TONE_EMOJI[tone]}
    </div>
);

const GlobalChat: React.FC<GlobalChatProps> = ({ userProfile, course, onOpenLesson, question, wideContent = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<StudentChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSession = useRef<AiChatSession | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const profileStyle: ChatbotStyle = userProfile?.chatbotStyle || 'Padrão';
    const [style, setStyle] = useState<ChatbotStyle>(profileStyle);

    const lessonsByNumber = useMemo(() => new Map(
        course.units.flatMap(unit => unit.lessons)
            .filter(lesson => lesson.number !== undefined)
            .map(lesson => [lesson.number as number, lesson])
    ), [course]);

    // The greeting is local; the AI is called only for the student's questions.
    const startConversation = () => {
        chatSession.current = createStudentChatSession(style);
        setMessages([{ role: 'model', content: WELCOME_MESSAGES[style], tone: style, timestamp: Date.now() }]);
    };

    useEffect(() => {
        startConversation();
    }, []);

    useEffect(() => {
        setStyle(profileStyle);
    }, [profileStyle]);

    // A new tone applies to the next answers; the history stays.
    useEffect(() => {
        if (chatSession.current) chatSession.current.style = style;
        setMessages(prev => prev.length === 1 && prev[0].role === 'model'
            ? [{ ...prev[0], content: WELCOME_MESSAGES[style], tone: style }]
            : prev);
    }, [style]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleResetChat = () => {
        startConversation();
    };

    const handleSendMessage = async (text = input) => {
        if (!text.trim() || !chatSession.current || isLoading) return;

        const userMessage: StudentChatMessage = { role: 'user', content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const tone = chatSession.current.style || 'Padrão';
        const { text: answer, lessons } = await sendStudentChatMessage(chatSession.current, text);
        const modelMessage: StudentChatMessage = { role: 'model', content: answer, lessons, tone, timestamp: Date.now() + 1 };
        setMessages(prev => [...prev, modelMessage]);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!question) return;
        setIsOpen(true);
        handleSendMessage(question.text);
    }, [question?.id]);

    const handleOpenLesson = (lesson: Lesson) => {
        onOpenLesson(lesson);
        setIsOpen(false);
    };

    const getChatbotHeader = () => {
        if (style === 'Amiguinho') {
            return {
                title: 'Stat, o Tutor Amiguinho',
                subtitle: 'Fofo, meloso e seu fã número um! 🥰✨',
                iconBg: 'bg-yellow-100 text-yellow-600'
            };
        } else if (style === 'Xarope') {
            return {
                title: 'StatChat',
                subtitle: 'Mal-humorado, impaciente e sem filtro.',
                iconBg: 'bg-slate-200 text-slate-600'
            };
        }
        return {
            title: 'Stat, Assistente Estatístico',
            subtitle: 'Tutor profissional e objetivo.',
            iconBg: 'bg-blue-100 text-blue-600'
        };
    };

    const header = getChatbotHeader();

    return (
        <>
            {/* Floating button: right next to the page content (56rem, 64rem on home), or the corner on narrow screens */}
            <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 px-6 md:left-80 lg:left-96">
                <div className={`mx-auto flex justify-end ${wideContent ? 'max-w-[72.5rem]' : 'max-w-[64.5rem]'}`}>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="chat-fab pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl leading-none shadow-xl hover:bg-blue-700"
                        aria-label="Abrir chat com tutor"
                        title={'Conversar com o tutor (' + (TONES.find(tone => tone.style === style)?.label || style) + ')'}
                    >
                        <span aria-hidden="true">{TONE_EMOJI[style]}</span>
                    </button>
                </div>
            </div>

            {/* Chat Modal/Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-slate-50 w-full h-[85vh] lg:h-[80vh] lg:max-w-2xl lg:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col animate-slide-up relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[--border-color] flex items-center justify-between gap-3 bg-white shadow-sm flex-shrink-0 lg:rounded-t-2xl">
                            <div className='flex min-w-0 items-center gap-3'>
                                <div className={`w-12 h-12 flex-shrink-0 ${header.iconBg} rounded-full flex items-center justify-center shadow-inner`}>
                                    <OwlIcon className="w-8 h-8"/>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-[--text-primary] text-base leading-tight">{header.title}</h2>
                                    <p className="hidden sm:block text-xs text-[--text-secondary] mt-0.5">{header.subtitle}</p>
                                </div>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1">
                                <div role="group" aria-label="Tom do tutor" className="flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5">
                                    {TONES.map(tone => (
                                        <button
                                            key={tone.style}
                                            onClick={() => setStyle(tone.style)}
                                            aria-pressed={style === tone.style}
                                            aria-label={'Tom: ' + tone.label}
                                            title={'Tom: ' + tone.label}
                                            className={`h-8 w-8 rounded-full text-lg leading-none transition-all ${
                                                style === tone.style
                                                    ? 'bg-white shadow ring-2 ring-blue-500'
                                                    : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                                            }`}
                                        >{tone.emoji}</button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleResetChat}
                                    disabled={isLoading}
                                    title="Resetar conversa"
                                    aria-label="Resetar conversa"
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                                >
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsOpen(false)} aria-label="Fechar chat" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && <ToneAvatar tone={msg.tone || style} />}
                                    <div className={`w-full max-w-[85%] p-3.5 rounded-2xl shadow-sm text-sm ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}>
                                        <MarkdownRenderer
                                            content={msg.content}
                                            className={`prose prose-sm prose-p:my-0.5 prose-headings:my-1 ${msg.role === 'user' ? 'prose-invert' : ''}`}
                                        />
                                        {Boolean(msg.lessons?.length) && (
                                            <div className="mt-3 border-t border-slate-100 pt-2">
                                                <p className="mb-1.5 text-xs font-semibold text-slate-500">Aulas consultadas</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {msg.lessons?.map(reference => {
                                                        const lesson = lessonsByNumber.get(reference.number);
                                                        const label = `Aula ${String(reference.number).padStart(2, '0')} — ${lesson?.title || reference.title}`;
                                                        return lesson ? (
                                                            <button
                                                                key={reference.number}
                                                                onClick={() => handleOpenLesson(lesson)}
                                                                className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-left text-xs font-medium text-blue-700 hover:bg-blue-100"
                                                            >
                                                                <BookOpenIcon className="h-3.5 w-3.5 flex-shrink-0" />{label}
                                                            </button>
                                                        ) : (
                                                            <span key={reference.number} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{label}</span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <ToneAvatar tone={style} />
                                    <div className="max-w-[85%] p-3.5 rounded-2xl bg-white border border-slate-200 rounded-tl-none">
                                        <Loader />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-200 bg-white lg:rounded-b-2xl">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Tire suas dúvidas sobre estatística..."
                                        disabled={isLoading}
                                        className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm disabled:bg-slate-50 shadow-inner"
                                    />
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={isLoading || !input.trim()}
                                        aria-label="Enviar"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                /* A short pulse every 5 seconds draws attention to the tutor. */
                @keyframes chat-fab-pulse {
                    0%, 82%, 100% { transform: scale(1); box-shadow: 0 10px 25px rgba(37, 99, 235, 0.35); }
                    87% { transform: scale(1.18); box-shadow: 0 0 0 12px rgba(37, 99, 235, 0.15); }
                    92% { transform: scale(0.96); }
                    96% { transform: scale(1.06); }
                }
                .chat-fab { animation: chat-fab-pulse 5s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) { .chat-fab { animation: none; } }
            `}</style>
        </>
    );
};

export default GlobalChat;
