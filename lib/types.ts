export type Role = 'admin' | 'inspector' | 'tc_qa'

export type ScopeSector = 'NABCB IAF SCOPE 17' | 'NABCB IAF SCOPE 18' | 'NABCB IAF SCOPE 19' | 'NABCB IAF SCOPE 28' | 'Other'
export type Scope17Category = string
export type Scope18Category = string
export type Scope19Category = string
export type Scope28Category = string

export interface TestAssignment {
  quizId: string
  conductedBy: string
  assignedAt: number
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  designation?: string
  informationDate?: string
  scopeSector?: ScopeSector
  scope17Category?: Scope17Category
  scope18Category?: Scope18Category
  scope19Category?: Scope19Category
  scope28Category?: Scope28Category
  assignedQuizIds?: string[]
  assignedTrainingIds?: string[]
  trainingCompletedIds?: string[]
  testAssignments?: TestAssignment[]
}

export type QuestionType = 'single' | 'multi' | 'boolean'

export interface Option {
  id: string
  text: string
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  options: Option[]
  /** ids of correct options (single/boolean have exactly one) */
  correct: string[]
  points: number
}

export type TrainingAssetType = 'video' | 'audio' | 'document'

export interface TrainingAsset {
  id: string
  type: TrainingAssetType
  title: string
  url: string
  fileName?: string
  description?: string
}

export interface TrainingResource extends TrainingAsset {
  audience: 'inspector'
}

export interface Quiz {
  id: string
  title: string
  description: string
  category: string
  /** total time limit in minutes */
  durationMinutes: number
  /** passing score as a percentage 0-100 */
  passingScore: number
  /** role that can take this assessment */
  targetRole?: 'inspector'
  questions: Question[]
  createdAt: number
}

export interface Attempt {
  id: string
  quizId: string
  quizTitle: string
  userId: string
  userName: string
  attemptNumber: 1 | 2 | 3
  /** map of questionId -> selected option ids */
  answers: Record<string, string[]>
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  competencyStatus?: 'COMPETENT' | 'NOT COMPETENT'
  startedAt?: number
  /** seconds spent */
  timeSpent: number
  submittedAt: number
  conductedBy?: string
}

export type ProctoringStatus = 'live' | 'completed' | 'interrupted'

export interface ProctoringSession {
  id: string
  quizId: string
  quizTitle: string
  userId: string
  userName: string
  startedAt: number
  endedAt?: number
  status: ProctoringStatus
  cameraGranted: boolean
  microphoneGranted: boolean
  recordingId?: string
  attemptId?: string
}
