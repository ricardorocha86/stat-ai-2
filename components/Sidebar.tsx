import React from 'react';
import { getCourseProgress, getLessonProgress, getLessonStars } from '../services/progressService';
import { Course, Lesson, Unit, Page, StudentProgress, ViewMode, Achievements, AchievementMilestone, UserProfile } from '../types';
import { BookOpenIcon, ChevronRightIcon, HomeIcon, QuestionMarkCircleIcon, StatAiIcon, LogoutIcon, StarIcon, TrophyIcon, GiftIcon, UserIcon, PencilSquareIcon } from './Icons';

const ACCOUNT_LINKS: { target: Page; label: string; ariaLabel: string; Icon: React.FC<{ className?: string }> }[] = [
  { target: 'home', label: 'Início', ariaLabel: 'Início', Icon: HomeIcon },
  { target: 'profile', label: 'Perfil', ariaLabel: 'Meu perfil', Icon: UserIcon },
  { target: 'about', label: 'Sobre', ariaLabel: 'Sobre o App', Icon: QuestionMarkCircleIcon },
];

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

  const calculateLessonProgress = (lesson: Lesson) => ({
      ...getLessonProgress(lesson, studentProgress),
      stars: getLessonStars(lesson, studentProgress),
  });

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
      <div className="mb-6 px-2">
        <button onClick={() => handleSelectPage('home')} className="flex items-center gap-3 mb-1" aria-label="Ir para o início">
          <StatAiIcon className="text-[--accent] w-9 h-9 drop-shadow-glow" />
          <span className="text-2xl font-black text-white tracking-tight">Stat-AI 2.0</span>
        </button>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-12 flex items-center gap-2">
          <span className="w-4 h-[1px] bg-slate-700"></span>
          Portal do Aluno
        </p>
      </div>

      {/* Account card: who is signed in, the profile shortcut and the app navigation in one block */}
      <div className="mb-6 px-2">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] shadow-2xl">
          <button
            onClick={() => handleSelectPage('profile')}
            className="group flex w-full items-center gap-4 rounded-t-3xl p-4 text-left transition-colors hover:bg-white/[0.06]"
            aria-label="Editar meu perfil"
            title="Editar meu perfil"
          >
            <div className="relative flex-shrink-0">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white/10 bg-slate-700 shadow-inner ring-4 ring-white/5 transition-transform duration-300 group-hover:scale-105">
                {userProfile.photoBase64 ? (
                  <img src={userProfile.photoBase64.startsWith('http') || userProfile.photoBase64.startsWith('data:') ? userProfile.photoBase64 : `data:${userProfile.photoMimeType || 'image/png'};base64,${userProfile.photoBase64}`} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg border-2 border-slate-900 bg-[--accent] shadow-lg">
                <PencilSquareIcon className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold leading-tight text-white">{userProfile.name}</p>
              <p className="truncate text-xs text-slate-400">{userProfile.email}</p>
            </div>
          </button>
          <nav aria-label="Navegação do portal" className="grid grid-cols-4 gap-1 border-t border-white/10 p-2">
            {ACCOUNT_LINKS.map(({ target, label, ariaLabel, Icon }) => (
              <button
                key={target}
                onClick={() => handleSelectPage(target)}
                aria-label={ariaLabel}
                aria-current={page === target ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors ${
                  page === target ? 'bg-[--accent] text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
            <button
              onClick={onLogout}
              aria-label="Sair"
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-200"
            >
              <LogoutIcon className="h-5 w-5" />
              Sair
            </button>
          </nav>
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
              aria-expanded={openUnits.has(unit.id)}
              className="group w-full flex items-center gap-2 text-left py-2"
            >
              <ChevronRightIcon className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-white ${openUnits.has(unit.id) ? 'rotate-90' : ''}`} />
              <h2 className="text-base font-semibold text-slate-200 group-hover:text-white">{unit.title}</h2>
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
                        {lesson.kind === 'reference' || lesson.number === undefined ? (
                          <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <span className="w-5 flex-shrink-0 text-xs font-semibold tabular-nums opacity-60">
                            <span className="sr-only">Aula </span>{String(lesson.number).padStart(2, '0')}
                          </span>
                        )}
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
      
    </aside>
  );
};

export default Sidebar;