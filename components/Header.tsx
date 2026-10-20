import React from 'react';
import { Page, Lesson, Unit } from '../types';
import { Bars3Icon, HomeIcon } from './Icons';

interface HeaderProps {
    page: Page;
    lesson: Lesson | null;
    unit: Unit | null;
    onToggleSidebar: () => void;
    isSidebarOpen?: boolean;
    isSidebarCollapsed?: boolean;
    onToggleDesktopSidebar?: () => void;
    onGoHome: () => void;
    // Name of the open probability calculator, if any.
    toolName?: string | null;
}

const Header: React.FC<HeaderProps> = ({ page, lesson, unit, onToggleSidebar, onGoHome, toolName, isSidebarOpen = false, isSidebarCollapsed = false, onToggleDesktopSidebar }) => {

    const getTitle = () => {
        switch(page) {
            case 'home':
                return { main: "Área do Aluno", breadcrumb: "Portal" };
            case 'about':
                return { main: "Sobre o Stat-AI 2.0", breadcrumb: "Informações" };
            case 'profile':
                return { main: "Meu Perfil", breadcrumb: "Configurações" };
            case 'tools':
                return toolName
                    ? { main: toolName, breadcrumb: "Ferramentas · Calculadoras de probabilidade" }
                    : { main: "Calculadoras de Probabilidade", breadcrumb: "Ferramentas" };
            case 'playground':
                return { main: "Playground de Probabilidade", breadcrumb: "Ferramentas" };
            case 'sigma-game':
                return { main: "A Lenda de Sigma", breadcrumb: "Jogos" };
            case 'lesson':
                if (lesson) {
                    const lessonNumber = lesson.kind !== 'reference' && lesson.number !== undefined
                        ? ' · Aula ' + String(lesson.number).padStart(2, '0') : '';
                    return { main: lesson.title, breadcrumb: (unit?.title || 'Curso') + lessonNumber };
                }
                return { main: "Lição", breadcrumb: "Curso" };
            default:
                return { main: "Portal", breadcrumb: "" };
        }
    }

    const { main, breadcrumb } = getTitle();

    return (
        <header className="flex-shrink-0 bg-slate-900 border-b border-white/10 px-4 md:px-6 h-[65px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <button onClick={onToggleSidebar} className="p-1 text-slate-300 hover:text-white md:hidden flex-shrink-0" aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={isSidebarOpen} aria-controls="portal-sidebar">
                    <Bars3Icon className="w-6 h-6"/>
                </button>
                {onToggleDesktopSidebar && (
                    <button
                        type="button"
                        onClick={onToggleDesktopSidebar}
                        aria-label={isSidebarCollapsed ? 'Mostrar barra lateral' : 'Recolher barra lateral'}
                        title={isSidebarCollapsed ? 'Mostrar barra lateral' : 'Recolher barra lateral'}
                        aria-expanded={!isSidebarCollapsed}
                        aria-controls="portal-sidebar"
                        className="hidden md:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <path d="M9 4v16" />
                            <path strokeLinecap="round" strokeLinejoin="round" d={isSidebarCollapsed ? 'm13 9 3 3-3 3' : 'm16 9-3 3 3 3'} />
                        </svg>
                    </button>
                )}
                {page !== 'home' && (
                    <button onClick={onGoHome} className="flex-shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Voltar ao início" title="Voltar ao início">
                        <HomeIcon className="w-6 h-6" />
                    </button>
                )}
                <div className="min-w-0">
                    <p className="text-xs md:text-sm text-slate-400 truncate">{breadcrumb}</p>
                    <h1 className="text-lg md:text-xl font-bold text-white truncate">{main}</h1>
                </div>
            </div>
        </header>
    );
}

export default Header;
