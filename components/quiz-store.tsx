'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Attempt, ProctoringSession, Question, Quiz, TrainingResource, User } from '@/lib/types'
import { seedAttempts, seedQuizzes, seedUsers } from '@/lib/sample-data'
import { deleteProctoringRecording } from '@/components/proctoring'

const STORAGE_KEY = 'dyc-quiz-state-v1'
const CANONICAL_ADMIN = seedUsers.find((user) => user.role === 'admin') as User

interface PersistedState {
  users: User[]
  quizzes: Quiz[]
  trainingResources?: TrainingResource[]
  attempts: Attempt[]
  proctoringSessions?: ProctoringSession[]
  currentUserId: string | null
}

interface QuizContextValue {
  ready: boolean
  currentUser: User | null
  users: User[]
  quizzes: Quiz[]
  trainingResources: TrainingResource[]
  attempts: Attempt[]
  proctoringSessions: ProctoringSession[]
  login: (email: string, password: string) => { ok: boolean; error?: string }
  resetAdminPassword: (password: string) => { ok: boolean; error?: string }
  createAccount: (name: string, email: string, password: string, role: 'inspector' | 'tc_qa') => { ok: boolean; error?: string }
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => { ok: boolean; error?: string }
  changeUserPassword: (id: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  saveQuiz: (quiz: Quiz) => void
  saveTrainingResource: (resource: TrainingResource) => void
  deleteTrainingResource: (id: string) => void
  completeTrainingResource: (id: string) => void
  deleteQuiz: (id: string) => void
  beginAttempt: (quiz: Quiz) => Promise<{ attemptId: string; attemptNumber: 1 | 2 | 3; attemptToken: string }>
  submitAttempt: (quiz: Quiz, answers: Record<string, string[]>, timeSpent: number, attemptId: string, attemptToken: string) => Promise<Attempt>
  startProctoringSession: (quiz: Quiz, cameraGranted: boolean, microphoneGranted: boolean) => ProctoringSession
  finishProctoringSession: (id: string, status: 'completed' | 'interrupted', attemptId?: string, recordingId?: string) => void
  deleteProctoringSession: (id: string) => Promise<{ ok: boolean; error?: string }>
}

const QuizContext = createContext<QuizContextValue | null>(null)

function scoreQuiz(quiz: Quiz, answers: Record<string, string[]>) {
  let score = 0
  let maxScore = 0
  for (const q of quiz.questions) {
    maxScore += q.points
    const selected = answers[q.id] ?? []
    if (isCorrect(q, selected)) score += q.points
  }
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  return { score, maxScore, percentage, passed: percentage >= quiz.passingScore }
}

export function isCorrect(question: Question, selected: string[]) {
  const correct = question.correct
  if (selected.length !== correct.length) return false
  const set = new Set(correct)
  return selected.every((s) => set.has(s))
}

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [users, setUsers] = useState<User[]>(seedUsers)
  const [quizzes, setQuizzes] = useState<Quiz[]>(seedQuizzes)
  const [trainingResources, setTrainingResources] = useState<TrainingResource[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>(seedAttempts)
  const [proctoringSessions, setProctoringSessions] = useState<ProctoringSession[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState
        if (parsed.users?.length) {
          const normalizedUsers = parsed.users.map((user) => {
            const isParagTechnicalManager = user.name.trim().toLowerCase() === 'parag wadekar'
            return user.role === ('tc' as User['role']) || user.role === ('qa' as User['role']) || isParagTechnicalManager
              ? { ...user, role: 'tc_qa' as const }
              : user
          })
          const savedUsers = normalizedUsers.filter((user) => user.role !== 'admin')
          setUsers([CANONICAL_ADMIN, ...seedUsers.filter((user) => user.role !== 'admin').map((user) => normalizedUsers.find((savedUser) => savedUser.id === user.id) ?? user), ...savedUsers.filter((user) => !seedUsers.some((seedUser) => seedUser.id === user.id))])
        }
        if (parsed.quizzes) setQuizzes(parsed.quizzes)
        if (parsed.trainingResources) setTrainingResources(parsed.trainingResources)
        if (parsed.attempts) setAttempts(parsed.attempts)
        if (parsed.proctoringSessions) setProctoringSessions(parsed.proctoringSessions)
        setCurrentUserId(parsed.currentUserId ?? null)
      }
    } catch {
      // ignore corrupted storage
    }
    setReady(true)
  }, [])

  // persist
  useEffect(() => {
    if (!ready) return
    const state: PersistedState = { users, quizzes, trainingResources, attempts, proctoringSessions, currentUserId }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [ready, users, quizzes, trainingResources, attempts, proctoringSessions, currentUserId])

  useEffect(() => {
    function syncFromOtherTab(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue) as PersistedState
        if (parsed.attempts) setAttempts(parsed.attempts)
        if (parsed.proctoringSessions) setProctoringSessions(parsed.proctoringSessions)
      } catch {
        // ignore malformed cross-tab updates
      }
    }
    window.addEventListener('storage', syncFromOtherTab)
    return () => window.removeEventListener('storage', syncFromOtherTab)
  }, [])

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  )

  useEffect(() => {
    if (!ready || currentUser?.role !== 'inspector') return
    fetch(`/api/inspector-attempts?userId=${encodeURIComponent(currentUser.id)}`)
      .then((response) => response.ok ? response.json() as Promise<{ attempts: Attempt[] }> : Promise.reject(new Error('Unable to sync assessment history.')))
      .then(({ attempts: serverAttempts }) => {
        setAttempts((previous) => [
          ...serverAttempts,
          ...previous.filter((attempt) => !serverAttempts.some((serverAttempt) => serverAttempt.id === attempt.id)),
        ])
      })
      .catch(() => undefined)
  }, [ready, currentUser?.id, currentUser?.role])

  const login = useCallback(
    (email: string, password: string) => {
      const user = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      )
      if (!user) return { ok: false, error: 'No account found with that email.' }
      if (user.password !== password) return { ok: false, error: 'Incorrect password.' }
      setCurrentUserId(user.id)
      return { ok: true }
    },
    [users],
  )

  const resetAdminPassword = useCallback((password: string) => {
    if (password.trim().length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
    setUsers((prev) => prev.map((user) => user.id === CANONICAL_ADMIN.id ? { ...user, password } : user))
    return { ok: true }
  }, [])

  const createAccount = useCallback(
    (name: string, email: string, password: string, role: 'inspector' | 'tc_qa') => {
      if (currentUser?.role !== 'admin') return { ok: false, error: 'Only Admin can create accounts.' }
      const normalizedEmail = email.trim().toLowerCase()
      if (!name.trim() || !normalizedEmail || !password) return { ok: false, error: 'Complete all account fields.' }
      if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, error: 'An account with that email already exists.' }
      }
      const user: User = { id: `u-${Date.now()}`, name: name.trim(), email: email.trim(), password, role }
      setUsers((prev) => [...prev, user])
      return { ok: true }
    },
    [currentUser, users],
  )

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((user) => user.id === id ? { ...user, ...updates } : user))
  }, [])

  const deleteUser = useCallback((id: string) => {
    if (currentUser?.role !== 'admin') return { ok: false, error: 'Only Admin can delete accounts.' }
    if (id === currentUser.id) return { ok: false, error: 'The Admin account cannot be deleted.' }
    setUsers((prev) => prev.filter((user) => user.id !== id))
    return { ok: true }
  }, [currentUser])

  const changeUserPassword = useCallback((id: string, password: string) => {
    if (currentUser?.role !== 'admin') return { ok: false, error: 'Only Admin can change account passwords.' }
    if (password.trim().length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
    setUsers((prev) => prev.map((user) => user.id === id ? { ...user, password } : user))
    return { ok: true }
  }, [currentUser])

  const logout = useCallback(() => setCurrentUserId(null), [])

  const saveQuiz = useCallback((quiz: Quiz) => {
    setQuizzes((prev) => {
      const idx = prev.findIndex((q) => q.id === quiz.id)
      if (idx === -1) return [quiz, ...prev]
      const next = [...prev]
      next[idx] = quiz
      return next
    })
  }, [])

  const saveTrainingResource = useCallback((resource: TrainingResource) => {
    setTrainingResources((prev) => {
      const idx = prev.findIndex((item) => item.id === resource.id)
      if (idx === -1) return [resource, ...prev]
      const next = [...prev]
      next[idx] = resource
      return next
    })
  }, [])

  const deleteTrainingResource = useCallback((id: string) => {
    setTrainingResources((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const completeTrainingResource = useCallback((id: string) => {
    if (currentUser?.role !== 'inspector') return
    setUsers((prev) => prev.map((user) => user.id === currentUser.id
      ? { ...user, trainingCompletedIds: Array.from(new Set([...(user.trainingCompletedIds ?? []), id])) }
      : user,
    ))
  }, [currentUser])

  const deleteQuiz = useCallback((id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id))
    setAttempts((prev) => prev.filter((a) => a.quizId !== id))
  }, [])

  const beginAttempt = useCallback(async (quiz: Quiz) => {
    if (!currentUser || currentUser.role !== 'inspector') throw new Error('Only an Inspector can start this assessment.')
    const response = await fetch('/api/inspector-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', userId: currentUser.id, userName: currentUser.name, quizId: quiz.id, quizTitle: quiz.title }),
    })
    const payload = await response.json() as { error?: string; attemptId?: string; attemptNumber?: 1 | 2 | 3; attemptToken?: string }
    if (!response.ok || !payload.attemptId || !payload.attemptNumber || !payload.attemptToken) throw new Error(payload.error ?? 'The assessment could not be started.')
    return { attemptId: payload.attemptId, attemptNumber: payload.attemptNumber, attemptToken: payload.attemptToken }
  }, [currentUser])

  const submitAttempt = useCallback(async (quiz: Quiz, answers: Record<string, string[]>, timeSpent: number, attemptId: string, attemptToken: string) => {
    if (!currentUserId) throw new Error('Your Inspector session has expired. Please sign in again.')
    const response = await fetch('/api/inspector-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', userId: currentUserId, attemptId, attemptToken, quiz, answers, timeSpent }),
    })
    const payload = await response.json() as Attempt | { error?: string }
    if (!response.ok || !('id' in payload)) throw new Error(('error' in payload && payload.error) || 'The assessment could not be submitted.')
    setAttempts((previous) => [payload, ...previous.filter((attempt) => attempt.id !== payload.id)])
    return payload
  }, [currentUserId])

  const startProctoringSession = useCallback(
    (quiz: Quiz, cameraGranted: boolean, microphoneGranted: boolean) => {
      const session: ProctoringSession = {
        id: `proctor-${Date.now()}`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        userId: currentUserId ?? 'unknown',
        userName: currentUser?.name ?? 'Unknown',
        startedAt: Date.now(),
        status: 'live',
        cameraGranted,
        microphoneGranted,
      }
      setProctoringSessions((prev) => [session, ...prev])
      return session
    },
    [currentUser, currentUserId],
  )

  const finishProctoringSession = useCallback(
    (id: string, status: 'completed' | 'interrupted', attemptId?: string, recordingId?: string) => {
      setProctoringSessions((prev) => prev.map((session) => session.id === id
        ? { ...session, status, endedAt: Date.now(), attemptId, recordingId }
        : session,
      ))
    },
    [],
  )

  const deleteProctoringSession = useCallback(async (id: string) => {
    if (currentUser?.role !== 'admin') return { ok: false, error: 'Only Admin can delete monitoring footage.' }
    const session = proctoringSessions.find((item) => item.id === id)
    if (!session) return { ok: false, error: 'The monitoring session no longer exists.' }
    try {
      if (session.recordingId) await deleteProctoringRecording(session.recordingId)
    } catch {
      return { ok: false, error: 'The footage could not be deleted from browser storage.' }
    }
    setProctoringSessions((prev) => prev.filter((session) => session.id !== id))
    return { ok: true }
  }, [currentUser, proctoringSessions])

  const value: QuizContextValue = {
    ready,
    currentUser,
    users,
    quizzes,
    trainingResources,
    attempts,
    proctoringSessions,
    login,
    resetAdminPassword,
    createAccount,
    updateUser,
    deleteUser,
    changeUserPassword,
    logout,
    saveQuiz,
    saveTrainingResource,
    deleteTrainingResource,
    completeTrainingResource,
    deleteQuiz,
    beginAttempt,
    submitAttempt,
    startProctoringSession,
    finishProctoringSession,
    deleteProctoringSession,
  }

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuizStore() {
  const ctx = useContext(QuizContext)
  if (!ctx) throw new Error('useQuizStore must be used within QuizProvider')
  return ctx
}
