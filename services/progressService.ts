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
