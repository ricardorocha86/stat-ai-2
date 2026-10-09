import { Course } from '../types';
import catalog from '../public/aulas/catalogo.json';

const course: Course = {
  title: catalog.title,
  contentVersion: catalog.contentVersion,
  units: catalog.units.map(unit => ({
    id: unit.id,
    title: unit.title,
    lessons: unit.lessons.map(lesson => ({ ...lesson, exercises: [] })),
  })),
};

export default course;
