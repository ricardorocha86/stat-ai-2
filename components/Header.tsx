import React from 'react';
import { Page, Lesson, Unit } from '../types';
import { Bars3Icon } from './Icons';

interface HeaderProps {
    page: Page;
    lesson: Lesson | null;
    unit: Unit | null;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ page, lesson, unit, onToggleSidebar }) => {

    const getTitle = () => {
        switch(page) {
            case 'home':
                return { main: "Área do Aluno", breadcrumb: "Portal" };
            case 'about':
                return { main: "Sobre o Stat-AI 2.0", breadcrumb: "Informações" };
            case 'profile':
                return { main: "Meu Perfil", breadcrumb: "Configurações" };
            case 'lesson':
                if (lesson) {
                    return { main: lesson.title, breadcrumb: unit?.title || 'Curso' };
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
                <button onClick={onToggleSidebar} className="p-1 text-slate-300 hover:text-white md:hidden flex-shrink-0" aria-label="Abrir menu">
                    <Bars3Icon className="w-6 h-6"/>
                </button>
                <div className="min-w-0">
                    <p className="text-xs md:text-sm text-slate-400 truncate">{breadcrumb}</p>
                    <h1 className="text-lg md:text-xl font-bold text-white truncate">{main}</h1>
                </div>
            </div>
        </header>
    );
}

export default Header;