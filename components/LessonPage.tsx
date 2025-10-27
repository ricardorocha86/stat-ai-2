import React, { useState } from 'react';
import { Course, Lesson, Unit, ViewMode, Exercise, StudentProgress, StructuredLesson } from '../types';
import ExerciseList from './ExerciseList';
import ChatPanel from './ChatPanel';
import StudentView from './StudentView';
import LessonViewer from './LessonViewer';

interface LessonPageProps {
  lesson: Lesson;
  unit: Unit | null;
  course: Course;
  viewMode: ViewMode;
  onSaveExercise: (newExercise: Omit<Exercise, 'id'>) => void;
  onSaveExercises: (newExercises: Omit<Exercise, 'id'>[]) => void;
  studentProgress: StudentProgress;
  onCompleteExercise: (lessonId: string, exerciseId: string) => void;
  interactiveMaterial: StructuredLesson | null;
  onSetInteractiveMaterial: (content: StructuredLesson) => void;
  onClearInteractiveMaterial: () => void;
}

const LessonPage: React.FC<LessonPageProps> = ({ 
  lesson, unit, course, viewMode, onSaveExercise, onSaveExercises, 
  studentProgress, onCompleteExercise, interactiveMaterial, 
  onSetInteractiveMaterial, onClearInteractiveMaterial 
}) => {
  
  const renderProfessorView = () => (
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:flex-1 md:overflow-y-auto">
        <ExerciseList lesson={lesson} unit={unit} course={course} />
      </div>
      <div className="w-full md:w-1/3 lg:w-2/5 border-t-2 md:border-t-0 md:border-l-2 border-slate-200 flex flex-col">
        <ChatPanel lesson={lesson} onSaveExercise={onSaveExercise} onSaveExercises={onSaveExercises} />
      </div>
    </div>
  );
  
  const renderStudentView = () => {
    return (
      <StudentView 
        lesson={lesson} 
        studentProgress={studentProgress} 
        onCompleteExercise={onCompleteExercise}
        interactiveMaterial={interactiveMaterial}
        onSetInteractiveMaterial={onSetInteractiveMaterial}
        onClearInteractiveMaterial={onClearInteractiveMaterial}
      />
    );
  };

  return (
    <div className="h-full">
      {viewMode === 'professor' ? renderProfessorView() : renderStudentView()}
    </div>
  );
};

export default LessonPage;
