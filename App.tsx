
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import LessonPage from './components/LessonPage';
import Header from './components/Header';
import { Course, Lesson, Unit, Exercise, ViewMode, Page, StudentProgress, Achievements, Achievement, AchievementMilestone, AchievementDisplayState, AchievementVersion, UserProfile, StructuredLesson } from './types';
import initialCourseData from './data/courseData';
import { loadCourseExercises } from './services/courseService';
import { getCourseProgress } from './services/progressService';
import LoginPage from './components/LoginPage';
import { generateAchievementReward } from './services/aiService';
import AchievementModal from './components/AchievementModal';
import OnboardingModal from './components/OnboardingModal';
import ProfilePage from './components/ProfilePage';
import GlobalChat from './components/GlobalChat';
import ProbabilityToolsPage, { getCalculatorName } from './components/tools/ProbabilityToolsPage';
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
    saveStudentProgress,
    uploadAchievementAudio,
    saveAchievementMetadata,
    syncUserProfile,
    fetchStudentProgress,
    fetchAchievements,
    getUserProfile,
    saveLastLesson,
    uploadProfilePicture
 } from './services/firebaseService';

// Test mode unlocks every reward and calls the AI, so only the course owner sees it.
const ACHIEVEMENT_TEST_EMAILS = ['ricardo8610@gmail.com'];
// New rewards are paused while the prizes are redesigned; rewards already earned stay viewable.
const ACHIEVEMENT_REWARDS_PAUSED = true;

const App: React.FC = () => {
  const [course, setCourse] = useState<Course>(initialCourseData);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  // Professor mode stays in the code but is not offered in the interface.
  const [viewMode] = useState<ViewMode>('aluno');
  const [page, setPage] = useState<Page>('home');
  // Open probability calculator on the tools page; null shows all of them.
  const [calculatorId, setCalculatorId] = useState<string | null>(null);
  // A question typed on the home page, handed to the tutor chat.
  const [tutorQuestion, setTutorQuestion] = useState<{ text: string; id: number } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAchievementTestMode, setIsAchievementTestMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [interactiveMaterials, setInteractiveMaterials] = useState<{ [lessonId: string]: StructuredLesson }>({});
  const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(true);
  const [courseLoadingError, setCourseLoadingError] = useState<string | null>(null);
  const [courseLoadAttempt, setCourseLoadAttempt] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'Aluno', email: '' });

  const [studentProgress, setStudentProgress] = useState<StudentProgress>({});

  const [achievements, setAchievements] = useState<Achievements>({});
  const [testAchievements, setTestAchievements] = useState<Achievements>({});
  
  const [achievementToDisplay, setAchievementToDisplay] = useState<AchievementDisplayState | null>(null);
  const [isGeneratingAchievement, setIsGeneratingAchievement] = useState(false);

  const allExercisesCount = useMemo(() => {
    return getCourseProgress(course, {}).totalCount;
  }, [course]);

  const canUseAchievementTestMode = Boolean(currentUser?.email && ACHIEVEMENT_TEST_EMAILS.includes(currentUser.email));

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          const existingProfile = await getUserProfile(user.uid);
          
          if (!existingProfile || !existingProfile.isOnboarded) {
             const profile: UserProfile = {
                name: user.displayName || 'Aluno',
                email: user.email || '',
                photoBase64: user.photoURL || undefined
            };
            setUserProfile(profile);
            setShowOnboarding(true);
          } else {
            setUserProfile(existingProfile);
            setShowOnboarding(false);
            await loadUserData(user.uid);
            // Ensure lastLogin is updated even if profile is already there
            await syncUserProfile(user.uid, existingProfile);
          }
        } catch (error) {
           console.error("App: Error fetching user profile:", error);
           // Fallback default profile if error
           const profile: UserProfile = {
                name: user.displayName || 'Aluno',
                email: user.email || '',
                photoBase64: user.photoURL || undefined
            };
            setUserProfile(profile);
            await loadUserData(user.uid); // Try loading data anyway
        }
      } else {
        setCurrentUser(null);
        setStudentProgress({});
        setAchievements({});
        setIsAchievementTestMode(false);
        setTestAchievements({});
        setShowOnboarding(false);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async (profile: UserProfile, photoFile?: File) => {
    if (!currentUser) return;
    
    try {
        let finalPhotoUrl = profile.photoBase64;
        
        if (photoFile) {
            finalPhotoUrl = await uploadProfilePicture(currentUser.uid, photoFile);
        }
        
        const finalProfile: UserProfile = { 
          ...profile, 
          photoBase64: finalPhotoUrl, 
          isOnboarded: true,
          chatbotStyle: profile.chatbotStyle || 'Padrão'
        };
        await syncUserProfile(currentUser.uid, finalProfile);
        setUserProfile(finalProfile);
        setShowOnboarding(false);
        await loadUserData(currentUser.uid);
    } catch (error) {
        console.error("App: Onboarding completion error:", error);
        throw error;
    }
  };

  const loadUserData = async (userId: string) => {
      try {
          const [progress, userAchievements] = await Promise.all([
              fetchStudentProgress(userId),
              fetchAchievements(userId)
          ]);
          setStudentProgress(progress);
          setAchievements(userAchievements);
      } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error);
      }
  };

  useEffect(() => {
    let active = true;
    setIsLoadingExercises(true);
    setCourseLoadingError(null);
    loadCourseExercises(initialCourseData)
      .then(loaded => {
        if (!active) return;
        setCourse(loaded);
        setSelectedLesson(previous => previous
          ? loaded.units.flatMap(unit => unit.lessons).find(lesson => lesson.id === previous.id) || null
          : null);
      })
      .catch(error => { if (active) setCourseLoadingError(error.message); })
      .finally(() => { if (active) setIsLoadingExercises(false); });
    return () => { active = false; };
  }, [courseLoadAttempt]);

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    // Remember where the student stopped; the reference page is not a lesson.
    if (currentUser && lesson.kind !== 'reference') {
      setUserProfile(profile => profile ? { ...profile, lastLessonId: lesson.id } : profile);
      saveLastLesson(currentUser.uid, lesson.id).catch(error => console.error('Erro ao salvar a última aula:', error));
    }
  };

  // No guard on selectedLesson here: the sidebar selects a lesson and switches page in the
  // same click, so this closure still sees the previous lesson. renderContent already falls
  // back to the home page when 'lesson' has no lesson.
  const handleSetPage = (newPage: Page) => {
    setPage(newPage);
    if (newPage === 'tools') setCalculatorId(null);
  };

  const handleProfileUpdate = async (updatedProfile: UserProfile, photoFile?: File) => {
    if (!currentUser) return;
    
    try {
        let finalPhotoUrl = updatedProfile.photoBase64;
        
        if (photoFile) {
            finalPhotoUrl = await uploadProfilePicture(currentUser.uid, photoFile);
        }
        
        // Sanitize object for Firestore (remove undefined)
        const finalProfile: UserProfile = { ...updatedProfile, isOnboarded: true };
        if (finalPhotoUrl) finalProfile.photoBase64 = finalPhotoUrl;
        
        // Clean undefined fields specifically
        if (finalProfile.registrationNumber === undefined) delete finalProfile.registrationNumber;
        if (finalProfile.origin === undefined) delete finalProfile.origin;
        if (finalProfile.photoBase64 === undefined) delete finalProfile.photoBase64;

        await syncUserProfile(currentUser.uid, finalProfile);
        setUserProfile(finalProfile);
    } catch (error) {
        console.error("App: Profile update error:", error);
        throw error;
    }
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setPage('home');
        setSelectedLesson(null);
        // Clear user-specific state
        setUserProfile({ name: 'Visitante', email: '', photoBase64: undefined });
        setStudentProgress({});
        setAchievements({});
    } catch (error) {
        console.error("App: Erro ao sair:", error);
    }
  };

  const handleToggleAchievementTestMode = () => {
    setIsAchievementTestMode(prev => {
        const next = !prev;
        if (next) {
            // Se estiver ativando, limpa a sessão de teste anterior
            setTestAchievements({});
        }
        return next;
    });
  };

  const generateAndStoreReward = useCallback(async (
      milestone: AchievementMilestone,
      isRegen: boolean,
      existing?: Achievement
  ) => {
      if (!currentUser) return;
      const activeAchievements = isAchievementTestMode ? testAchievements : achievements;
      const previousVersions: AchievementVersion[] = isRegen && existing
          ? [...(existing.previousVersions || []), {
              artifact: existing.artifact,
              transcricao: existing.transcricao,
              audioUrl: existing.audioUrl,
              generatedAt: existing.unlockedAt,
          }]
          : [];

      const result = await generateAchievementReward(
          milestone,
          userProfile,
          activeAchievements,
          previousVersions
      );

      if ('error' in result) {
          throw new Error(result.error);
      }

      let audioUrl = '';
      if (!isAchievementTestMode) {
          audioUrl = await uploadAchievementAudio(currentUser.uid, milestone, result.audioWavBase64);
      } else {
          audioUrl = `data:audio/wav;base64,${result.audioWavBase64}`;
      }

      const newAchievement: Achievement = {
          milestone: milestone,
          unlockedAt: Date.now(),
          kind: result.kind,
          artifact: result.artifact,
          transcricao: result.transcricao,
          audioUrl,
          previousVersions,
      };

      if (isAchievementTestMode) {
          setTestAchievements(prev => ({ ...prev, [milestone]: newAchievement }));
      } else {
          await saveAchievementMetadata(currentUser.uid, newAchievement);
          setAchievements(prev => ({ ...prev, [milestone]: newAchievement }));
      }

      return newAchievement;
  }, [currentUser, isAchievementTestMode, achievements, testAchievements, userProfile]);

  const handleClaimAchievement = useCallback(async (milestone: AchievementMilestone) => {
    const activeAchievements = isAchievementTestMode ? testAchievements : achievements;

    const existing = activeAchievements[milestone];
    const hasNewShape = existing && existing.kind && existing.artifact;
    if (existing && hasNewShape) {
        setAchievementToDisplay({
            milestone: existing.milestone,
            isLoading: false,
            kind: existing.kind,
            artifact: existing.artifact,
            transcricao: existing.transcricao,
            audioUrl: existing.audioUrl,
        });
        return;
    }

    if (ACHIEVEMENT_REWARDS_PAUSED || isGeneratingAchievement || !currentUser) return;

    setIsGeneratingAchievement(true);
    setAchievementToDisplay({ milestone, isLoading: true });

    try {
        const created = await generateAndStoreReward(milestone, false);
        if (!created) return;
        setAchievementToDisplay({
            milestone,
            isLoading: false,
            kind: created.kind,
            artifact: created.artifact,
            transcricao: created.transcricao,
            audioUrl: created.audioUrl,
        });
    } catch (error: any) {
        console.error(`Falha ao gerar recompensa para ${milestone} exercícios`, error);
        setAchievementToDisplay(prev => prev ? {
            ...prev,
            isLoading: false,
            error: `Falha ao gerar a recompensa: ${error.message}. Tente novamente.`
        } : null);
    } finally {
        setIsGeneratingAchievement(false);
    }
}, [isGeneratingAchievement, achievements, testAchievements, isAchievementTestMode, currentUser, generateAndStoreReward]);

  const handleRegenerateAchievement = useCallback(async () => {
      if (ACHIEVEMENT_REWARDS_PAUSED || !achievementToDisplay || !currentUser || isGeneratingAchievement) return;
      const milestone = achievementToDisplay.milestone;
      const activeAchievements = isAchievementTestMode ? testAchievements : achievements;
      const existing = activeAchievements[milestone];
      if (!existing) {
          handleClaimAchievement(milestone);
          return;
      }
      setIsGeneratingAchievement(true);
      setAchievementToDisplay(prev => prev ? { ...prev, isRegenerating: true, error: undefined } : null);
      try {
          const updated = await generateAndStoreReward(milestone, true, existing);
          if (!updated) return;
          setAchievementToDisplay({
              milestone,
              isLoading: false,
              isRegenerating: false,
              kind: updated.kind,
              artifact: updated.artifact,
              transcricao: updated.transcricao,
              audioUrl: updated.audioUrl,
          });
      } catch (error: any) {
          console.error(`Falha ao regenerar recompensa do marco ${milestone}`, error);
          setAchievementToDisplay(prev => prev ? {
              ...prev,
              isRegenerating: false,
              error: `Falha ao regenerar: ${error.message}.`,
          } : null);
      } finally {
          setIsGeneratingAchievement(false);
      }
  }, [achievementToDisplay, currentUser, isGeneratingAchievement, achievements, testAchievements, isAchievementTestMode, generateAndStoreReward, handleClaimAchievement]);

  const handleCompleteExercise = async (lessonId: string, exerciseId: string) => {
    if (currentUser) {
        await saveStudentProgress(currentUser.uid, lessonId, exerciseId);
    }

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
      numero: ex.numero || selectedLesson.exercises.length + index + 1,
      resourceBasePath: ex.resourceBasePath || '/' + selectedLesson.filePath.slice(0, selectedLesson.filePath.lastIndexOf('/') + 1),
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

  const renderHome = () => (
    <HomePage
      onSelectLesson={(lesson) => { handleSelectLesson(lesson); setPage('lesson'); }}
      course={course}
      studentProgress={studentProgress}
      userProfile={userProfile}
      onAskTutor={(text) => setTutorQuestion({ text, id: Date.now() })}
    />
  );

  const renderContent = () => {
    if (isLoadingExercises) return <div role="status" className="p-8 text-slate-600">Carregando aulas e exercícios…</div>;
    if (courseLoadingError) return (
      <div role="alert" className="m-6 rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        <p>{courseLoadingError}</p>
        <button onClick={() => setCourseLoadAttempt(attempt => attempt + 1)} className="mt-3 rounded bg-red-700 px-4 py-2 text-white">Tentar novamente</button>
      </div>
    );
    switch(page) {
      case 'home':
        return renderHome();
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
        return renderHome();
      case 'tools':
        return (
          <ProbabilityToolsPage
            calculatorId={calculatorId}
            onSelectCalculator={setCalculatorId}
            course={course}
            onOpenLesson={(lesson) => { handleSelectLesson(lesson); setPage('lesson'); }}
          />
        );
      case 'profile':
        return <ProfilePage userProfile={userProfile} onUpdateProfile={handleProfileUpdate} />;
      default:
        return renderHome();
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

  if (!currentUser) {
    return <LoginPage />;
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
        achievements={isAchievementTestMode ? testAchievements : achievements}
        onClaimAchievement={handleClaimAchievement}
        allExercisesCount={allExercisesCount}
        userProfile={userProfile}
        isAchievementTestMode={isAchievementTestMode}
        canUseAchievementTestMode={canUseAchievementTestMode}
        areNewRewardsPaused={ACHIEVEMENT_REWARDS_PAUSED}
        onToggleAchievementTestMode={handleToggleAchievementTestMode}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          page={page}
          lesson={selectedLesson}
          unit={selectedUnit}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onGoHome={() => setPage('home')}
          toolName={page === 'tools' ? getCalculatorName(calculatorId) : null}
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
             achievements={isAchievementTestMode ? testAchievements : achievements}
             onClose={() => setAchievementToDisplay(null)}
             onRetry={() => handleClaimAchievement(achievementToDisplay.milestone)}
             onRegenerate={ACHIEVEMENT_REWARDS_PAUSED ? undefined : handleRegenerateAchievement}
             userProfile={userProfile}
          />
        )}
        {showOnboarding && (
           <OnboardingModal 
              initialProfile={userProfile} 
              onComplete={handleOnboardingComplete} 
           />
        )}
        
        {/* Chatbot Global */}
        <GlobalChat
          userProfile={userProfile}
          course={course}
          onOpenLesson={(lesson) => { handleSelectLesson(lesson); setPage('lesson'); }}
          question={tutorQuestion}
          wideContent={page === 'home' || page === 'tools'}
        />
    </div>
  );
};

export default App;