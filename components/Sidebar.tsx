import React from 'react';
import { getCourseProgress, getLessonProgress } from '../services/progressService';
import { Course, Lesson, Unit, Page, StudentProgress, ViewMode, Achievements, AchievementMilestone, UserProfile } from '../types';
import { BookOpenIcon, QuestionMarkCircleIcon, StatAiIcon, LogoutIcon, StarIcon, TrophyIcon, GiftIcon, UserIcon, PencilSquareIcon } from './Icons';

interface SidebarProps {
  course: Course;
  selectedLesson: Lesson | null;
  onSelectLesson: (lesson: Lesson) => void;
  page: Page;
  setPage: (page: Page) => void;
  onLogout: () => void;
  studentProgress: StudentProgress;
  viewMode: ViewMode;
  achievements: Achievements;
  onClaimAchievement: (milestone: AchievementMilestone) => void;
  allExercisesCount: number;
  userProfile: UserProfile;
  isAchievementTestMode: boolean;
  canUseAchievementTestMode: boolean;
  areNewRewardsPaused: boolean;
  onToggleAchievementTestMode: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  course, selectedLesson, onSelectLesson, page, setPage, onLogout, 
  studentProgress, viewMode, achievements, onClaimAchievement, allExercisesCount,
  userProfile, isAchievementTestMode, canUseAchievementTestMode, areNewRewardsPaused, onToggleAchievementTestMode,
  isSidebarOpen, setIsSidebarOpen
}) => {
  const [openUnits, setOpenUnits] = React.useState<Set<string>>(() =>
    new Set(course.units.map(u => u.id))
  );

  const handleSelectLesson = (lesson: Lesson) => {
    onSelectLesson(lesson);
    setPage('lesson');
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };
  
  const handleSelectPage = (selectedPage: Page) => {
    setPage(selectedPage);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const NavLink: React.FC<{
    icon: React.ReactNode,
    label: string,
    isActive: boolean,
    onClick: () => void,
  }> = ({ icon, label, isActive, onClick }) => (
     <button
        onClick={onClick}
        className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-colors text-sm font-medium ${
          isActive
            ? 'bg-[--accent] text-white'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
  );

  const calculateLessonProgress = (lesson: Lesson) => {
      const { completedCount, totalCount } = getLessonProgress(lesson, studentProgress);
      if (totalCount === 0) return { completedCount: 0, totalCount: 0, stars: 0 };
      const percentage = completedCount / totalCount;
      let stars = 0;
      if (percentage > 0) stars = 1;
      if (percentage >= 0.5) stars = 2;
      if (percentage === 1) stars = 3;
      return { completedCount, totalCount, stars };
  };

  const { completedCount, totalCount } = getCourseProgress(course, studentProgress);
  const overallProgress = { totalCompleted: completedCount, totalExercises: totalCount };
  const overallPercentage = overallProgress.totalExercises > 0 ? (overallProgress.totalCompleted / overallProgress.totalExercises) * 100 : 0;

  const MILESTONES = React.useMemo(() => 
    [10, 20, 30, 40, 50].filter(m => m <= allExercisesCount) as AchievementMilestone[],
    [allExercisesCount]
  );

  const StarDisplay: React.FC<{ stars: number }> = ({ stars }) => (
    <div className="flex items-center">
        {[1, 2, 3].map(i => (
            <StarIcon key={i} className={`w-3.5 h-3.5 ${i <= stars ? 'text-yellow-400' : 'text-slate-600'}`} filled={i <= stars} />
        ))}
    </div>
  );

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-80 lg:w-96 bg-gradient-to-b from-slate-900 to-slate-800 p-4 flex-shrink-0 h-screen overflow-y-auto flex flex-col text-[--text-inverted] transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      {/* Header Section */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3 mb-1">
          <StatAiIcon className="text-[--accent] w-9 h-9 drop-shadow-glow" />
          <h1 className="text-2xl font-black text-white tracking-tight">Stat-AI 2.0</h1>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-12 flex items-center gap-2">
          <span className="w-4 h-[1px] bg-slate-700"></span>
          Portal do Aluno
        </p>
      </div>

      {/* Profile Section */}
      <div className="mb-8 px-2 group cursor-pointer" onClick={() => handleSelectPage('profile')}>
        <div className="relative p-4 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 shadow-2xl transition-all duration-300 group-hover:bg-white/[0.08] group-hover:border-white/20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-slate-700 border-2 border-white/10 overflow-hidden shadow-inner ring-4 ring-white/5 transition-transform group-hover:scale-105 duration-300">
                {userProfile.photoBase64 ? (
                  <img src={userProfile.photoBase64.startsWith('http') || userProfile.photoBase64.startsWith('data:') ? userProfile.photoBase64 : `data:${userProfile.photoMimeType || 'image/png'};base64,${userProfile.photoBase64}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[--accent] flex items-center justify-center shadow-lg border-2 border-slate-900">
                <PencilSquareIcon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white truncate leading-tight">{userProfile.name}</p>
              <p className="text-xs text-slate-400 truncate mb-2">{userProfile.email}</p>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-wider group-hover:text-[--accent] group-hover:border-[--accent]/30 transition-colors">
                 <span className="w-1 h-1 rounded-full bg-[--accent] animate-pulse"></span>
                 Meu Perfil
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="border-t border-white/10 mb-6 mx-2"></div>

      {/* Achievements Section */}
      {viewMode === 'aluno' && (
        <div className="px-2 space-y-4 mb-6">
            <p className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-2"><TrophyIcon className="w-4 h-4" /> Minhas Conquistas 🏆</p>
            <div>
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-slate-300">Exercícios verificados</span>
                    <span className="font-mono text-white">{overallProgress.totalCompleted} / {overallProgress.totalExercises}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 shadow-inner">
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${overallPercentage}%` }}></div>
                </div>
            </div>
            
            {canUseAchievementTestMode && (
                <button
                    onClick={onToggleAchievementTestMode}
                    className={`w-full text-xs py-1.5 rounded-md font-semibold transition-colors ${
                        isAchievementTestMode
                            ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                >
                    {isAchievementTestMode ? 'Desativar Modo de Teste' : 'Ativar Modo de Teste'}
                </button>
            )}

            {MILESTONES.length > 0 && (
                 <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-medium text-slate-300">Prêmios Parciais</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {MILESTONES.map(milestone => {
                            const isUnlocked = isAchievementTestMode || overallProgress.totalCompleted >= milestone;
                            const hasReward = !!achievements[milestone];
                            const canOpen = isUnlocked && (hasReward || !areNewRewardsPaused);

                            let buttonClass = 'bg-slate-700 text-slate-500 cursor-not-allowed';
                            let title = `${milestone} exercícios para desbloquear`;
                            let animationClass = '';

                            if (isUnlocked && !canOpen) {
                                // Milestone reached while new rewards are paused.
                                buttonClass = 'bg-slate-700 text-amber-300/70 cursor-not-allowed';
                                title = `Marco de ${milestone} exercícios alcançado. Os prêmios voltam em breve.`;
                            } else if (isUnlocked) {
                                if (hasReward) {
                                    // Claimed state
                                    buttonClass = 'bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 cursor-pointer';
                                    title = `Prêmio por ${milestone} exercícios! Clique para ver.`;
                                } else {
                                    // Ready to be claimed state
                                    buttonClass = 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white cursor-pointer';
                                    title = `Parabéns! Clique para resgatar seu prêmio por ${milestone} exercícios!`;
                                    animationClass = 'animate-pulse-glow';
                                }
                            }
                            
                            return (
                                <button
                                    key={milestone}
                                    disabled={!canOpen}
                                    onClick={() => onClaimAchievement(milestone)}
                                    className={`relative flex flex-col items-center justify-center p-2 rounded-lg aspect-square transition-all duration-200 ${buttonClass} ${animationClass}`}
                                    title={title}
                                >
                                    <GiftIcon className="w-6 h-6"/>
                                    <span className="text-xs font-bold mt-1">{milestone}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
      )}
      


      <div className="border-t border-white/10 mb-4 -mx-4"></div>

      <p className="text-xs font-semibold uppercase text-slate-400 mb-2 px-2">Conteúdo do Curso</p>
      <nav className="space-y-2 flex-1 px-2">
        {course.units.map((unit: Unit) => (
          <div key={unit.id}>
            <button
              onClick={() => {
                const newSet = new Set(openUnits);
                openUnits.has(unit.id) ? newSet.delete(unit.id) : newSet.add(unit.id);
                setOpenUnits(newSet);
              }}
              className="w-full flex justify-between items-center text-left py-2"
            >
              <h2 className="text-base font-semibold text-slate-200">{unit.title}</h2>
            </button>
            {openUnits.has(unit.id) && (
              <ul className="mt-1 space-y-1 pl-2 border-l border-white/10">
                {unit.lessons.map((lesson: Lesson) => {
                  const { stars, completedCount, totalCount } = calculateLessonProgress(lesson);
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => handleSelectLesson(lesson)}
                        className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-colors text-sm ${
                          page === 'lesson' && selectedLesson?.id === lesson.id
                            ? 'bg-[--accent] text-white font-medium'
                            : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{lesson.title}</span>
                         {viewMode === 'aluno' && totalCount > 0 && (
                            <div className="ml-auto flex items-center" title={`${completedCount} de ${totalCount} exercícios verificados`}>
                                <StarDisplay stars={stars} />
                            </div>
                         )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-white/10 space-y-1">
          <NavLink 
            icon={<QuestionMarkCircleIcon className="w-5 h-5" />} 
            label="Sobre o App" 
            isActive={page === 'about'} 
            onClick={() => handleSelectPage('about')} 
          />
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 p-2.5 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium" 
            title="Sair"
            aria-label="Sair"
          >
            <LogoutIcon className="w-5 h-5" />
            <span>Sair</span>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;