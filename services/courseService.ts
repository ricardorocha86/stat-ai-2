import { Course, Exercise } from '../types';

let courseRequest: Promise<Course> | undefined;

export const loadCourseExercises = (catalog: Course): Promise<Course> => {
  if (!courseRequest) {
    courseRequest = Promise.all(catalog.units.map(async unit => ({
      ...unit,
      lessons: await Promise.all(unit.lessons.map(async lesson => {
        const response = await fetch('/' + lesson.exercisesPath);
        if (!response.ok) throw new Error('Não foi possível carregar os exercícios de ' + lesson.title);
        const exercises: Exercise[] = await response.json();
        if (!Array.isArray(exercises)) throw new Error('Formato inválido em ' + lesson.title);
        return { ...lesson, exercises };
      })),
    }))).then(units => ({ ...catalog, units })).catch(error => {
      courseRequest = undefined;
      throw error;
    });
  }
  return courseRequest;
};
