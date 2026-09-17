'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Attempt, Quiz, User } from '@/lib/types'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character)
}

export function AnswerSheetDownload({
  attempt,
  quiz,
  user,
  attemptHistory = [attempt],
}: {
  attempt: Attempt
  quiz: Quiz
  user?: User
  attemptHistory?: Attempt[]
}) {
  function downloadAnswerSheet() {
    const history = [...attemptHistory].sort((a, b) => a.attemptNumber - b.attemptNumber)
    const finalAttempt = history[history.length - 1] ?? attempt
    const submitted = new Date(finalAttempt.submittedAt).toLocaleString()
    const finalStatus = finalAttempt.competencyStatus ?? (finalAttempt.passed ? 'COMPETENT' : 'IN PROGRESS')
    const profileRows = [
      ['Name of Examiner', user?.name ?? attempt.userName],
      ['Inspector ID', user?.id ?? attempt.userId],
      ['Designation', user?.designation],
      ['Scope sector', user?.scopeSector],
      ['Selected category', user?.scope17Category ?? user?.scope18Category ?? user?.scope19Category ?? user?.scope28Category],
      ['Test conducted by', attempt.conductedBy],
    ]
      .filter(([, value]) => value)
      .map(([label, value]) => `<div><strong>${label}</strong><span>${escapeHtml(value ?? '')}</span></div>`)
      .join('')
    const questions = quiz.questions
      .map((question, index) => {
        const selected = finalAttempt.answers[question.id] ?? []
        const selectedLabels = new Set(selected)
        const correctLabels = new Set(question.correct)
        const options = question.options
          .map((option) => {
            const selectedMark = selectedLabels.has(option.id) ? 'Selected answer' : ''
            const correctMark = correctLabels.has(option.id) ? 'Correct answer' : ''
            const labels = [selectedMark, correctMark].filter(Boolean).join(' · ')
            return `<li class="${selectedMark ? 'selected' : ''} ${correctMark ? 'correct' : ''}"><span>${escapeHtml(option.text)}</span>${labels ? `<b>${escapeHtml(labels)}</b>` : ''}</li>`
          })
          .join('')
        const answered = selected.length > 0 ? 'Answered' : 'Not answered'
        return `<section class="question"><div class="question-head"><h2>${index + 1}. ${escapeHtml(question.prompt)}</h2><span>${answered}</span></div><ul>${options}</ul></section>`
      })
      .join('')

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Answer sheet - ${escapeHtml(attempt.userName)} - ${escapeHtml(attempt.quizTitle)}</title>
<style>
  @page { size: A4; margin: 18mm; @bottom-right { content: 'Page ' counter(page) ' of ' counter(pages); color: #7b879a; font-size: 11px; } }
  * { box-sizing: border-box; }
  body { margin: 0; color: #182238; font-family: Arial, sans-serif; background: #fff; }
  header { position: relative; border-bottom: 3px solid #182b52; padding: 0 190px 18px 0; min-height: 74px; }
  .wordmark { position: absolute; top: 0; right: 0; color: #08296b; font-size: 24px; font-weight: 800; letter-spacing: 1px; white-space: nowrap; }
  h1 { margin: 0 0 8px; color: #182b52; font-size: 28px; }
  .meta { color: #627087; font-size: 13px; line-height: 1.7; }
  .profile { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; margin-top: 16px; padding: 12px; background: #f4f6fa; border: 1px solid #dfe4eb; }
  .profile div { display: flex; gap: 8px; font-size: 12px; }
  .profile strong { color: #182b52; }
  .profile span { color: #627087; }
  .score { display: inline-block; margin-top: 14px; padding: 8px 14px; border: 1px solid #d6af55; color: #70551f; font-weight: 700; }
  .history { margin-top: 18px; padding: 12px; border: 1px solid #dfe4eb; }
  .history h2 { margin: 0 0 8px; font-size: 14px; color: #182b52; }
  .history div { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 12px; }
  .history span { color: #627087; }
  .final-status { margin-top: 14px; padding: 10px; background: #fff0f0; color: #a13232; font-weight: 800; letter-spacing: .5px; }
  .question { break-inside: avoid; padding: 18px 0; border-bottom: 1px solid #dfe4eb; }
  .question-head { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
  h2 { margin: 0; font-size: 15px; line-height: 1.45; }
  .question-head span { flex-shrink: 0; color: #627087; font-size: 11px; text-transform: uppercase; }
  ul { margin: 10px 0 0; padding: 0; list-style: none; }
  li { display: flex; justify-content: space-between; gap: 14px; padding: 7px 10px; color: #627087; font-size: 13px; border-radius: 4px; }
  li.selected { background: #fff4d6; color: #594616; }
  li.correct { box-shadow: inset 3px 0 #2b8650; }
  li b { flex-shrink: 0; color: #2b8650; font-size: 10px; text-transform: uppercase; }
  footer { margin-top: 22px; color: #7b879a; font-size: 11px; }
</style>
</head>
<body>
<header>
  <div class="wordmark">DYC GLOBAL</div>
  <h1>ASSESSMENT RECORD</h1>
  <div class="meta"><strong>Test:</strong> ${escapeHtml(attempt.quizTitle)}<br><strong>Date:</strong> ${escapeHtml(submitted)}</div>
  <div class="profile">${profileRows}</div>
  <div class="score">Final Score: ${finalAttempt.percentage}% · ${finalAttempt.score}/${finalAttempt.maxScore} points · Final Competency Status: ${finalStatus}</div>
  <section class="history"><h2>Attempt history</h2>${history.map((item) => `<div><strong>Attempt ${item.attemptNumber} of 3</strong><span>${item.percentage}% · ${item.passed ? 'Passed' : 'Failed'} · ${escapeHtml(new Date(item.submittedAt).toLocaleString())}</span></div>`).join('')}</section>
  ${finalStatus === 'NOT COMPETENT' ? '<div class="final-status">FINAL COMPETENCY STATUS: NOT COMPETENT</div>' : ''}
</header>
<main>${questions}</main>
<footer>Generated by DYC Global Assessment Platform · Final Attempt ID ${escapeHtml(finalAttempt.id)}</footer>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    if (!printWindow) {
      URL.revokeObjectURL(url)
      return
    }
    printWindow.addEventListener('load', () => {
      printWindow.focus()
      printWindow.print()
      URL.revokeObjectURL(url)
    }, { once: true })
  }

  return (
    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={downloadAnswerSheet}>
      <Download className="h-4 w-4" />
      Save answer sheet as PDF
    </Button>
  )
}
