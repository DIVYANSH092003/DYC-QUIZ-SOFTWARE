'use client'

import Link from 'next/link'
import { AuthGate } from '@/components/auth-gate'
import { Card } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useQuizStore } from '@/components/quiz-store'

export default function InspectorDashboardPage() {
  return (
    <AuthGate role="inspector">
      <InspectorTests />
    </AuthGate>
  )
}

function InspectorTests() {
  const { quizzes, attempts, currentUser, trainingResources } = useQuizStore()
  const training = trainingResources.filter(
    (item) => currentUser?.assignedTrainingIds?.includes(item.id),
  )
  const completedTraining = currentUser?.trainingCompletedIds ?? []
  const trainingComplete = training.length === 0 || training.every((item) => completedTraining.includes(item.id))
  const available = quizzes.filter(
    (quiz) => (quiz.targetRole ?? 'inspector') === 'inspector' &&
      currentUser?.assignedQuizIds?.includes(quiz.id),
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Welcome, {currentUser?.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete your assigned inspector competency assessments and review your results.
        </p>
      </div>

      {!trainingComplete ? (
        <Card className="border-amber-200 bg-amber-50 py-8">
          <h2 className="font-heading text-lg font-semibold text-amber-950">Complete training before starting an assessment</h2>
          <p className="mt-2 text-sm text-amber-900">Open every assigned training resource in the reader. Video and audio resources must finish playing before your assessments are unlocked.</p>
          <Button render={<Link href="/training" />} nativeButton={false} className="mt-4 w-fit">Open training</Button>
        </Card>
      ) : available.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No inspector assessments are available right now. Please check back later.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {available.map((quiz) => {
            const mine = attempts.filter((attempt) => attempt.quizId === quiz.id && attempt.userId === currentUser?.id)
            const best = mine.length ? Math.max(...mine.map((attempt) => attempt.percentage)) : null
            const latest = [...mine].sort((a, b) => b.attemptNumber - a.attemptNumber)[0]
            const locked = latest?.competencyStatus === 'COMPETENT' || latest?.competencyStatus === 'NOT COMPETENT' || mine.length >= 3
            return (
              <Card key={quiz.id} className="flex flex-col gap-4">
                <div>
                  <h3 className="font-heading text-base font-semibold leading-snug text-balance">{quiz.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{best !== null ? `Percentage: ${best}%` : 'Percentage: Not attempted'}</p>
                  <p className="mt-1 text-sm font-semibold">{locked && latest?.competencyStatus === 'NOT COMPETENT' ? 'All 3 Attempts Failed' : `Attempt ${Math.min(mine.length + 1, 3)} of 3`}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">{locked && latest?.competencyStatus === 'NOT COMPETENT' ? 'FINAL STATUS: NOT COMPETENT' : latest && !latest.passed ? `Attempt ${latest.attemptNumber} Failed — Retake Available` : 'Test percentage'}</span>
                  {!locked && <Button render={<Link href={`/quiz/${quiz.id}`} />} nativeButton={false} size="sm">{mine.length ? 'Retake' : 'Start test'}</Button>}
                  {locked && latest?.competencyStatus === 'NOT COMPETENT' && <span className="text-xs font-semibold text-destructive">Retake: Not Available</span>}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
