'use client'

import { use } from 'react'
import Link from 'next/link'
import { AuthGate } from '@/components/auth-gate'
import { QuizTaker } from '@/components/candidate/quiz-taker'
import { Button } from '@/components/ui/button'
import { useQuizStore } from '@/components/quiz-store'

export default function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <AuthGate role="inspector">
      <TakeQuiz id={id} />
    </AuthGate>
  )
}

function TakeQuiz({ id }: { id: string }) {
  const { quizzes, attempts, currentUser, trainingResources } = useQuizStore()
  const training = trainingResources.filter(
    (item) => currentUser?.assignedTrainingIds?.includes(item.id),
  )
  const completedTraining = currentUser?.trainingCompletedIds ?? []
  const trainingComplete = training.length === 0 || training.every((item) => completedTraining.includes(item.id))
  const quiz = quizzes.find(
    (q) =>
      q.id === id &&
      (q.targetRole ?? 'inspector') === currentUser?.role &&
      currentUser?.assignedQuizIds?.includes(q.id),
  )

  if (!quiz || !trainingComplete) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {!trainingComplete ? 'Complete all assigned training resources before starting this assessment.' : 'This assessment is not available.'}
        </p>
        <Button render={<Link href={!trainingComplete ? '/training' : currentUser?.role === 'inspector' ? '/inspector' : '/dashboard'} />} nativeButton={false} variant="outline" className="mt-4">
          {!trainingComplete ? 'Open training' : 'Back to tests'}
        </Button>
      </div>
    )
  }

  const mine = attempts.filter((attempt) => attempt.quizId === quiz.id && attempt.userId === currentUser?.id)
  const finalAttempt = [...mine].sort((a, b) => b.attemptNumber - a.attemptNumber)[0]
  if (finalAttempt?.competencyStatus === 'COMPETENT') {
    return <div className="py-16 text-center"><p className="font-semibold">This assessment is already marked COMPETENT. Retakes are not permitted.</p><Button render={<Link href="/inspector" />} nativeButton={false} variant="outline" className="mt-4">Back to tests</Button></div>
  }
  if (finalAttempt?.competencyStatus === 'NOT COMPETENT' || mine.length >= 3) {
    return <div className="py-16 text-center"><p className="font-semibold text-destructive">You have used all 3 permitted attempts. You are not competent based on the assessment result. A 4th attempt is not permitted.</p><Button render={<Link href="/inspector" />} nativeButton={false} variant="outline" className="mt-4">Back to tests</Button></div>
  }

  return <QuizTaker quiz={quiz} />
}
