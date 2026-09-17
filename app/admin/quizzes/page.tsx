'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Clock, HelpCircle, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { AuthGate } from '@/components/auth-gate'
import { Badge, Card } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useQuizStore } from '@/components/quiz-store'

export default function AdminQuizzesPage() {
  return (
    <AuthGate role="admin">
      <QuizzesList />
    </AuthGate>
  )
}

function QuizzesList() {
  const { quizzes, deleteQuiz, attempts } = useQuizStore()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const sorted = [...quizzes].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, assign, and manage assessments.
          </p>
        </div>
        <Button render={<Link href="/admin/quizzes/new" />} nativeButton={false} className="gap-2">
          <Plus className="h-4 w-4" />
          New quiz
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No quizzes yet. Create your first assessment to get started.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((q) => {
            const count = attempts.filter((a) => a.quizId === q.id).length
            return (
              <Card key={q.id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone="primary">{q.category || 'Uncategorized'}</Badge>
                      <Badge tone="neutral">Inspector</Badge>
                    </div>
                    <h3 className="font-heading text-base font-semibold leading-snug text-balance">
                      {q.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {q.description || 'No description.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" /> {q.questions.length} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {q.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" /> {q.passingScore}% to pass
                  </span>
                  <span>{count} attempts</span>
                </div>

                {confirmId === q.id ? (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-destructive/10 px-3 py-2">
                    <span className="text-sm text-destructive">Delete this quiz?</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          deleteQuiz(q.id)
                          setConfirmId(null)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-t border-border pt-4">
                    <Button
                      render={<Link href={`/admin/quizzes/${q.id}`} />} nativeButton={false}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto gap-1 text-destructive hover:text-destructive"
                      onClick={() => setConfirmId(q.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
