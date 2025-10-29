import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import LessonPage from './components/LessonPage';
import Header from './components/Header';
import { Course, Lesson, Unit, Exercise, ViewMode, Page, StudentProgress, Achievements, Achievement, AchievementMilestone, AchievementDisplayState, UserProfile, StructuredLesson } from './types';
import initialCourseData from './data/courseData';
import LoginPage from './components/LoginPage';
import { generateOracleFragment } from './services/geminiService';
import AchievementModal from './components/AchievementModal';


const App: React.FC = () => {
  const [course, setCourse] = useState<Course>(initialCourseData);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('aluno');
  const [page, setPage] = useState<Page>('home');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAchievementTestMode, setIsAchievementTestMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [interactiveMaterials, setInteractiveMaterials] = useState<{ [lessonId: string]: StructuredLesson }>({});

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
        const savedProfile = localStorage.getItem('userProfile');
        return savedProfile ? JSON.parse(savedProfile) : { name: 'Aluno', email: 'aluno@escola.com' };
    } catch (error) {
        console.error("Não foi possível carregar o perfil do usuário do localStorage", error);
        return { name: 'Aluno', email: 'aluno@escola.com' };
    }
  });

  const [studentProgress, setStudentProgress] = useState<StudentProgress>(() => {
    try {
        const savedProgress = localStorage.getItem('studentProgress');
        if (savedProgress) {
            const parsed = JSON.parse(savedProgress);
            Object.keys(parsed).forEach(lessonId => {
                parsed[lessonId] = new Set(parsed[lessonId]);
            });
            return parsed;
        }
    } catch (error) {
        console.error("Não foi possível carregar o progresso do aluno do localStorage", error);
    }
    return {};
  });

  const [achievements, setAchievements] = useState<Achievements>(() => {
    try {
        const savedAchievements = localStorage.getItem('studentAchievements');
        return savedAchievements ? JSON.parse(savedAchievements) : {};
    } catch (error) {
        console.error("Não foi possível carregar as conquistas do aluno do localStorage", error);
        return {};
    }
  });
  
  const [achievementToDisplay, setAchievementToDisplay] = useState<AchievementDisplayState | null>(null);
  const [isGeneratingAchievement, setIsGeneratingAchievement] = useState(false);

  const allExercisesCount = useMemo(() => {
    return course.units.flatMap(u => u.lessons).reduce((acc, lesson) => acc + lesson.exercises.length, 0);
  }, [course]);

  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn');
    setTimeout(() => {
      if (loggedInStatus === 'true') {
        setIsLoggedIn(true);
      }
      setIsAuthLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    try {
        const serializableProgress: { [key: string]: string[] } = {};
        Object.keys(studentProgress).forEach(lessonId => {
            serializableProgress[lessonId] = Array.from(studentProgress[lessonId]);
        });
        localStorage.setItem('studentProgress', JSON.stringify(serializableProgress));
    } catch (error) {
        console.error("Não foi possível salvar o progresso do aluno no localStorage", error);
    }
  }, [studentProgress]);

  useEffect(() => {
    try {
        localStorage.setItem('studentAchievements', JSON.stringify(achievements));
    } catch (error) {
        console.error("Não foi possível salvar as conquistas do aluno no localStorage", error);
    }
  }, [achievements]);

  useEffect(() => {
    try {
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } catch (error) {
        console.error("Não foi possível salvar o perfil do usuário no localStorage", error);
    }
}, [userProfile]);

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setPage('home');
    setSelectedLesson(null);
    setIsLoggedIn(false);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };
  
  const handleSetPage = (newPage: Page) => {
    if (newPage === 'lesson' && !selectedLesson) {
      setPage('home');
    } else {
      setPage(newPage);
    }
  };

  const handleProfileChange = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
  };
  
  const handleToggleAchievementTestMode = () => {
    setIsAchievementTestMode(prev => !prev);
  };

  const handleClaimAchievement = useCallback(async (milestone: AchievementMilestone) => {
    if (achievements[milestone]) {
        const claimed = achievements[milestone];
        setAchievementToDisplay({ 
            milestone: claimed.milestone,
            isLoading: false,
            type: claimed.type,
            title: claimed.title,
            storyText: claimed.storyText,
            contentBase64: claimed.contentBase64,
        });
        return;
    }
    
    if (isGeneratingAchievement) return;

    setIsGeneratingAchievement(true);
    setAchievementToDisplay({ 
        milestone, 
        isLoading: true,
    });
    
    try {
        const fragmentResult = await generateOracleFragment(milestone, userProfile, achievements);

        if ('error' in fragmentResult) {
            throw new Error(fragmentResult.error);
        }

        const newAchievement: Achievement = {
            milestone,
            unlockedAt: Date.now(),
            ...fragmentResult,
        } as Achievement;

        setAchievements(prev => ({ ...prev, [milestone]: newAchievement }));
        
        setAchievementToDisplay({
            milestone,
            isLoading: false,
            type: newAchievement.type,
            title: newAchievement.title,
            storyText: newAchievement.storyText,
            contentBase64: newAchievement.contentBase64,
        });

    } catch (error: any) {
        console.error(`Falha ao gerar recompensa para ${milestone} exercícios`, error);
        setAchievementToDisplay(prev => {
            if (!prev) return null;
            return {
                ...prev,
                isLoading: false,
                error: `Falha ao gerar a recompensa: ${error.message}. Por favor, tente novamente.`
            };
        });
    } finally {
        setIsGeneratingAchievement(false);
    }
}, [isGeneratingAchievement, achievements, userProfile]);

  const handleCompleteExercise = (lessonId: string, exerciseId: string) => {
    setStudentProgress(prev => {
        if (prev[lessonId]?.has(exerciseId)) {
            return prev;
        }
        const newProgress = { ...prev };
        const lessonProgress = new Set(newProgress[lessonId] || []);
        lessonProgress.add(exerciseId);
        newProgress[lessonId] = lessonProgress;
        return newProgress;
    });
  };

  const handleSaveExercises = (newExercises: Omit<Exercise, 'id'>[]) => {
    if (!selectedLesson) return;

    const exercisesWithIds: Exercise[] = newExercises.map((ex, index) => ({
      ...ex,
      id: `ex-${Date.now()}-${index}`,
    }));

    setCourse(prevCourse => {
        const updatedCourse = JSON.parse(JSON.stringify(prevCourse));
        const unit = updatedCourse.units.find((u: Unit) => u.lessons.some((l: Lesson) => l.id === selectedLesson.id));
        if (unit) {
            const lesson = unit.lessons.find((l: Lesson) => l.id === selectedLesson.id);
            if (lesson) {
                lesson.exercises.push(...exercisesWithIds);
            }
        }
        return updatedCourse;
    });

    setSelectedLesson(prevLesson => {
        if (!prevLesson) return null;
        const updatedLesson = { ...prevLesson };
        updatedLesson.exercises = [...updatedLesson.exercises, ...exercisesWithIds];
        return updatedLesson;
    });
  };

  const handleSaveExercise = (newExercise: Omit<Exercise, 'id'>) => {
    handleSaveExercises([newExercise]);
  };
  
  const handleSetInteractiveMaterial = (lessonId: string, content: StructuredLesson) => {
    setInteractiveMaterials(prev => ({ ...prev, [lessonId]: content }));
  };

  const handleClearInteractiveMaterial = (lessonId: string) => {
      setInteractiveMaterials(prev => {
          const newMaterials = { ...prev };
          delete newMaterials[lessonId];
          return newMaterials;
      });
  };

  const selectedUnit = selectedLesson ? course.units.find(u => u.lessons.some(l => l.id === selectedLesson.id)) || null : null;

  const renderContent = () => {
    switch(page) {
      case 'home':
        return <HomePage 
            onSelectLesson={(lesson) => { handleSelectLesson(lesson); setPage('lesson'); }} 
            course={course} 
            studentProgress={studentProgress}
        />;
      case 'about':
        return <AboutPage />;
      case 'lesson':
        if (selectedLesson) {
          return (
            <LessonPage
              lesson={selectedLesson}
              unit={selectedUnit}
              course={course}
              viewMode={viewMode}
              onSaveExercise={handleSaveExercise}
              onSaveExercises={handleSaveExercises}
              studentProgress={studentProgress}
              onCompleteExercise={handleCompleteExercise}
              interactiveMaterial={interactiveMaterials[selectedLesson.id] || null}
              onSetInteractiveMaterial={(content) => handleSetInteractiveMaterial(selectedLesson.id, content)}
              onClearInteractiveMaterial={() => handleClearInteractiveMaterial(selectedLesson.id)}
            />
          );
        }
        return <HomePage onSelectLesson={(lesson) => { handleSelectLesson(lesson); setPage('lesson'); }} course={course} studentProgress={studentProgress} />;
      default:
        return <HomePage onSelectLesson={(lesson) => { handleSelectLesson(lesson); setPage('lesson'); }} course={course} studentProgress={studentProgress} />;
    }
  }
  
  if (isAuthLoading) {
    return (
      <div className="w-screen h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen font-sans bg-[--bg-main] overflow-hidden">
      <Sidebar 
        course={course} 
        selectedLesson={selectedLesson} 
        onSelectLesson={handleSelectLesson} 
        page={page}
        setPage={handleSetPage}
        onLogout={handleLogout}
        studentProgress={studentProgress}
        viewMode={viewMode}
        achievements={achievements}
        onClaimAchievement={handleClaimAchievement}
        allExercisesCount={allExercisesCount}
        userProfile={userProfile}
        onProfileChange={handleProfileChange}
        isAchievementTestMode={isAchievementTestMode}
        onToggleAchievementTestMode={handleToggleAchievementTestMode}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          page={page}
          lesson={selectedLesson}
          unit={selectedUnit}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
       {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}
       {achievementToDisplay && (
          <AchievementModal 
             achievementData={achievementToDisplay} 
             achievements={achievements}
             onClose={() => setAchievementToDisplay(null)} 
             onRetry={() => handleClaimAchievement(achievementToDisplay.milestone)}
          />
        )}
    </div>
  );
};

export default App;