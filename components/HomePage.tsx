import React from 'react';
import { Course, Lesson, StudentProgress } from '../types';
import { BookOpenIcon, StatAiIcon, TrophyIcon } from './Icons';

interface HomePageProps {
  course: Course;
  onSelectLesson: (lesson: Lesson) => void;
  studentProgress: StudentProgress;
}

const HomePage: React.FC<HomePageProps> = ({ course, onSelectLesson, studentProgress }) => {
  const quickAccessLessons = course.units.flatMap(u => u.lessons).slice(0, 4);

  const calculateOverallProgress = () => {
      let totalCompleted = 0;
      let totalExercises = 0;
      course.units.forEach(unit => {
          unit.lessons.forEach(lesson => {
              totalCompleted += (studentProgress[lesson.id] || new Set()).size;
              totalExercises += lesson.exercises.length;
          });
      });
      return { totalCompleted, totalExercises };
  };

  const { totalCompleted, totalExercises } = calculateOverallProgress();
  const overallPercentage = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0;


  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center bg-[--accent-light] text-[--accent] rounded-2xl">
              <StatAiIcon className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[--text-primary] tracking-tight">
              Bem-vindo ao Stat-AI 2.0
            </h1>
            <p className="mt-1 text-md text-[--text-secondary]">
              Seu portal inteligente para dominar a estatística. Pronto para começar?
            </p>
          </div>
        </div>

        <div className="mt-10">
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">Seu Progresso 🚀</h2>
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-slate-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-blue-500 transition-all duration-500" strokeWidth="3" strokeDasharray={`${overallPercentage}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-slate-700">{overallPercentage}%</div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-800">{totalCompleted} <span className="text-xl font-medium text-slate-500">de {totalExercises}</span></p>
                        <p className="text-slate-600">Exercícios completos. Continue assim!</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-[--text-primary] mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickAccessLessons.map(lesson => (
              <button 
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                className="bg-[--bg-card] p-5 rounded-xl border border-[--border-color] text-left hover:border-[--accent] hover:shadow-lg transition-all duration-200 group"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg mb-3">
                  <BookOpenIcon />
                </div>
                <h3 className="font-semibold text-[--text-primary] group-hover:text-[--accent] transition-colors">{lesson.title}</h3>
                <p className="text-sm text-[--text-secondary] mt-1">
                  {course.units.find(u => u.lessons.some(l => l.id === lesson.id))?.title}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
