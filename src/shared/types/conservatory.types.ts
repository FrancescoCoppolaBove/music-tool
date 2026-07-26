export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  conservatory?: string;
  createdAt: number;
}

export interface ClassDoc {
  id?: string;
  teacherId: string;
  name: string;
  studentIds: string[];
  createdAt: number;
}

export interface AssignmentDoc {
  id?: string;
  classId: string;
  teacherId: string;
  moduleId: string;
  level: 1 | 2 | 3;
  mode: 'training' | 'exam';
  dueDate: number;
  createdAt: number;
  title: string;
}

export interface SubmissionDoc {
  id?: string;
  userId: string;
  assignmentId?: string;
  moduleId: string;
  score: number;
  answers: Array<{
    questionId: string;
    given: string;
    correct: string;
    isCorrect: boolean;
    timeMs: number;
  }>;
  completedAt: number;
  durationMs: number;
}
