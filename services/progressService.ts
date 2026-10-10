import { Course, Lesson, StudentProgress } from '../types';

export const getLessonProgress = (lesson: Lesson, progress: StudentProgress) => {
  const exercises = lesson.exercises.filter(exercise =>
    exercise.categoria !== 'atividade' &&
    exercise.correcao_automatica !== false &&
    Boolean(exercise.solucao_completa),
  );
  const completed = progress[lesson.id] || new Set<string>();
  return {
    completedCount: exercises.filter(exercise => completed.has(exercise.id)).length,
    totalCount: exercises.length,
  };
};

export const getCourseProgress = (course: Course, progress: StudentProgress) =>
  course.units.flatMap(unit => unit.lessons).reduce((total, lesson) => {
    const current = getLessonProgress(lesson, progress);
    return {
      completedCount: total.completedCount + current.completedCount,
      totalCount: total.totalCount + current.totalCount,
    };
  }, { completedCount: 0, totalCount: 0 });

// One star when a lesson has a verified exercise, two at half, three when complete.
export const getLessonStars = (lesson: Lesson, progress: StudentProgress) => {
  const { completedCount, totalCount } = getLessonProgress(lesson, progress);
  if (totalCount === 0 || completedCount === 0) return 0;
  if (completedCount === totalCount) return 3;
  return completedCount / totalCount >= 0.5 ? 2 : 1;
};

export const getCourseStars = (course: Course, progress: StudentProgress) => {
  const lessons = course.units.flatMap(unit => unit.lessons).filter(lesson => getLessonProgress(lesson, progress).totalCount > 0);
  return {
    stars: lessons.reduce((total, lesson) => total + getLessonStars(lesson, progress), 0),
    maxStars: lessons.length * 3,
  };
};
