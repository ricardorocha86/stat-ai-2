import React, { useState, useEffect, useRef } from 'react';
import { AiChatSession, StudentChatMessage, UserProfile, ChatbotStyle } from '../types';
import { createStudentChatSession, sendStudentChatMessage } from '../services/geminiService';
import { OwlIcon, SparklesIcon, XMarkIcon, PaperAirplaneIcon } from './Icons';
import Loader from './Loader';
import MarkdownRenderer from './MarkdownRenderer';

const ArrowPathIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

interface GlobalChatProps {
    userProfile?: UserProfile | null;
}

const GlobalChat: React.FC<GlobalChatProps> = ({ userProfile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<StudentChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSession = useRef<AiChatSession | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const chatbotStyle: ChatbotStyle = userProfile?.chatbotStyle || 'Xarope';

    useEffect(() => {
        if (isOpen && !chatSession.current) {
            const initChat = async () => {
                setIsLoading(true);
                const session = createStudentChatSession(chatbotStyle);
                chatSession.current = session;
                const welcomeMessage = await sendStudentChatMessage(session, "Olá, qual sua dúvida?");
                setMessages([{ role: 'model', content: welcomeMessage, timestamp: Date.now() }]);
                setIsLoading(false);
            };
            initChat();
        }
    }, [isOpen, chatbotStyle]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleResetChat = async () => {
        setIsLoading(true);
        setMessages([]);
        const session = createStudentChatSession(chatbotStyle);
        chatSession.current = session;
        const welcomeMessage = await sendStudentChatMessage(session, "Olá novamente! Em que mais posso te ajudar?");
        setMessages([{ role: 'model', content: welcomeMessage, timestamp: Date.now() }]);
        setIsLoading(false);
    };

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

    const getChatbotHeader = () => {
        if (chatbotStyle === 'Amiguinho') {
            return {
                title: 'Stat, o Tutor Amiguinho',
                subtitle: 'Sempre aqui para te ajudar com um sorriso! ✨',
                iconBg: 'bg-yellow-100 text-yellow-600'
            };
        } else if (chatbotStyle === 'Xarope') {
            return {
                title: 'StatChat',
                subtitle: 'Seu tutor de estatística. Sarcástico e brilhante.',
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
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-xl z-50 hover:bg-blue-700 transition-transform transform hover:scale-110 flex items-center justify-center"
                aria-label="Abrir chat com tutor"
            >
                <OwlIcon className="w-8 h-8"/>
            </button>

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
                            <div className='flex items-center gap-3'>
                                <div className={`w-12 h-12 flex-shrink-0 ${header.iconBg} rounded-full flex items-center justify-center shadow-inner`}>
                                    <OwlIcon className="w-8 h-8"/>
                                </div>
                                <div>
                                    <h2 className="font-bold text-[--text-primary] text-base leading-tight">{header.title}</h2>
                                    <p className="text-xs text-[--text-secondary] mt-0.5">{header.subtitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={handleResetChat} 
                                    disabled={isLoading}
                                    title="Resetar conversa"
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                                >
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                            <SparklesIcon className="w-5 h-5"/>
                                        </div>
                                    )}
                                    <div className={`w-full max-w-[85%] p-3.5 rounded-2xl shadow-sm text-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}>
                                        <MarkdownRenderer 
                                            content={msg.content} 
                                            className={`prose prose-sm prose-p:my-0.5 prose-headings:my-1 ${msg.role === 'user' ? 'prose-invert' : ''}`} 
                                        />
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                        <SparklesIcon className="w-5 h-5"/>
                                    </div>
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
                                        onClick={handleSendMessage} 
                                        disabled={isLoading || !input.trim()} 
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
            `}</style>
        </>
    );
};

export default GlobalChat;
