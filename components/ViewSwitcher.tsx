import React from 'react';
import { ViewMode } from '../types';
import { BriefcaseIcon, GraduationCapIcon } from './Icons';

interface ViewSwitcherProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="bg-black/20 p-1 rounded-lg flex items-center">
      <button
        onClick={() => setViewMode('professor')}
        className={`flex items-center justify-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-semibold rounded-md transition-colors ${
          viewMode === 'professor'
            ? 'bg-white/90 text-slate-800 shadow-sm'
            : 'bg-transparent text-slate-300 hover:bg-white/10'
        }`}
      >
        <BriefcaseIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Professor</span>
      </button>
      <button
        onClick={() => setViewMode('aluno')}
        className={`flex items-center justify-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-semibold rounded-md transition-colors ${
          viewMode === 'aluno'
            ? 'bg-white/90 text-slate-800 shadow-sm'
            : 'bg-transparent text-slate-300 hover:bg-white/10'
        }`}
      >
        <GraduationCapIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Aluno</span>
      </button>
    </div>
  );
};

export default ViewSwitcher;