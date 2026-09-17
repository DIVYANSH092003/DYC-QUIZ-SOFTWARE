'use client'

import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { AnswerSheetDownload } from '@/components/answer-sheet-download'
import { CertificateDownload } from '@/components/certificate-download'
import { AuthGate } from '@/components/auth-gate'
import { Badge, Card, Select } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useQuizStore } from '@/components/quiz-store'

export default function AdminResultsPage() {
  return (
    <AuthGate role="admin">
      <Results />
    </AuthGate>
  )
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

function Results() {
  const { attempts, quizzes, users } = useQuizStore()
  const [quizFilter, setQuizFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return attempts
      .filter((a) => (quizFilter === 'all' ? true : a.quizId === quizFilter))
      .filter((a) =>
        statusFilter === 'all'
          ? true
          : statusFilter === 'pass'
            ? a.passed
            : !a.passed,
      )
      .sort((a, b) => b.submittedAt - a.submittedAt)
  }, [attempts, quizFilter, statusFilter])

  const avg =
    filtered.length > 0
      ? Math.round(filtered.reduce((s, a) => s + a.percentage, 0) / filtered.length)
      : 0
  const passCount = filtered.filter((a) => a.passed).length

  function exportCsv() {
    const header = ['Inspector', 'Test', 'Score', 'Percentage', 'Result', 'Time', 'Submitted']
    const lines = filtered.map((a) =>
      [
        a.userName,
        a.quizTitle,
        `${a.score}/${a.maxScore}`,
        `${a.percentage}%`,
        a.passed ? 'Pass' : 'Fail',
        formatTime(a.timeSpent),
        new Date(a.submittedAt).toISOString(),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'dyc-results.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Results</h1>
          <p className="text-sm text-muted-foreground">
            All inspector attempts across assessments.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="font-heading text-2xl font-bold">{filtered.length}</p>
          <p className="text-xs text-muted-foreground">Attempts</p>
        </Card>
        <Card>
          <p className="font-heading text-2xl font-bold">{avg}%</p>
          <p className="text-xs text-muted-foreground">Average score</p>
        </Card>
        <Card>
          <p className="font-heading text-2xl font-bold">
            {passCount}/{filtered.length}
          </p>
          <p className="text-xs text-muted-foreground">Passed</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-56">
          <Select value={quizFilter} onChange={(e) => setQuizFilter(e.target.value)}>
            <option value="all">All assessments</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All results</option>
            <option value="pass">Passed only</option>
            <option value="fail">Failed only</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No attempts match these filters.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Inspector</th>
                <th className="px-5 py-3 font-medium">Assessment</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Result</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Answer sheet</th>
                <th className="px-5 py-3 font-medium">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-secondary/40">
                  <td className="px-5 py-3 font-medium">{a.userName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.quizTitle}</td>
                  <td className="px-5 py-3">
                    <span className="font-semibold">{a.percentage}%</span>
                    <span className="text-muted-foreground">
                      {' '}
                      ({a.score}/{a.maxScore})
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={a.passed ? 'success' : 'danger'}>
                      {a.passed ? 'Pass' : 'Fail'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatTime(a.timeSpent)}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatDate(a.submittedAt)}
                  </td>
                  <td className="px-5 py-3">
                    {(() => {
                      const quiz = quizzes.find((item) => item.id === a.quizId)
                      return quiz ? <AnswerSheetDownload attempt={a} attemptHistory={attempts.filter((item) => item.userId === a.userId && item.quizId === a.quizId)} quiz={quiz} user={users.find((user) => user.id === a.userId)} /> : null
                    })()}
                  </td>
                  <td className="px-5 py-3">
                    <CertificateDownload
                      attempt={a}
                      role={users.find((user) => user.id === a.userId)?.role ?? 'inspector'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
