'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Attempt, Role } from '@/lib/types'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character)
}

function fileSafe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function CertificateDownload({
  attempt,
  role = 'inspector',
}: {
  attempt: Attempt
  role?: Role
}) {
  if (!attempt.passed && attempt.competencyStatus !== 'NOT COMPETENT') return null

  function downloadCertificate() {
    const submitted = new Date(attempt.submittedAt).toLocaleString()
    const status = attempt.passed ? 'COMPETENT' : 'NOT COMPETENT'
    const roleName = role === 'inspector' ? 'Inspector' : role === 'admin' ? 'Administrator' : 'TM / QA'
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Certificate - ${escapeHtml(attempt.userName)} - ${escapeHtml(attempt.quizTitle)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: #fcfcfb; color: #15233f; font-family: Georgia, 'Times New Roman', serif; }
  .certificate { width: 1123px; min-height: 794px; margin: 0 auto; padding: 58px; background: #fff; border: 18px solid #152b56; outline: 2px solid #d6af55; outline-offset: -34px; text-align: center; }
  .eyebrow { margin: 22px 0 8px; color: #8c6828; font: 700 14px Arial, sans-serif; letter-spacing: 4px; text-transform: uppercase; }
  h1 { margin: 0; color: #152b56; font-size: 48px; letter-spacing: 1px; }
  .rule { width: 160px; height: 3px; margin: 22px auto; background: #d6af55; }
  .intro { margin: 0; font: 16px Arial, sans-serif; color: #53627a; }
  .name { margin: 28px 0 8px; font-size: 42px; font-weight: 700; color: #152b56; }
  .role { margin: 0; font: 700 14px Arial, sans-serif; letter-spacing: 2px; text-transform: uppercase; color: #8c6828; }
  .assessment { margin: 26px auto 30px; max-width: 760px; font-size: 25px; font-weight: 700; }
  .details { display: flex; justify-content: center; gap: 56px; margin: 28px 0; font-family: Arial, sans-serif; }
  .detail strong { display: block; margin-bottom: 6px; font-size: 25px; color: #152b56; }
  .detail span { color: #68758a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  .status { display: inline-block; padding: 10px 25px; border: 2px solid ${attempt.passed ? '#2b8650' : '#b54343'}; color: ${attempt.passed ? '#2b8650' : '#b54343'}; font: 700 16px Arial, sans-serif; letter-spacing: 2px; }
  .footer { margin-top: 34px; font: 12px Arial, sans-serif; color: #78849a; }
</style>
</head>
<body>
  <main class="certificate">
    <p class="eyebrow">DYC Global Assessment Platform</p>
    <h1>Certificate of Assessment</h1>
    <div class="rule"></div>
    <p class="intro">This certificate is awarded to</p>
    <p class="name">${escapeHtml(attempt.userName)}</p>
    <p class="role">${roleName}</p>
    <p class="intro" style="margin-top:24px">for completing the assessment</p>
    <p class="assessment">${escapeHtml(attempt.quizTitle)}</p>
    <div class="details">
      <div class="detail"><strong>${attempt.percentage}%</strong><span>Score</span></div>
      <div class="detail"><strong>${attempt.score}/${attempt.maxScore}</strong><span>Points</span></div>
      <div class="detail"><strong>${escapeHtml(submitted)}</strong><span>Completed</span></div>
    </div>
    <div class="status">${status}</div>
    ${!attempt.passed ? '<p class="footer">The Inspector did not achieve competency after the maximum 3 permitted attempts.</p>' : ''}
    <p class="footer">Issued by DYC Global Private Limited · Assessment ID ${escapeHtml(attempt.id)}</p>
  </main>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileSafe(attempt.userName)}-${fileSafe(attempt.quizTitle)}-certificate.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={downloadCertificate}>
      <Download className="h-4 w-4" />
      Export certificate
    </Button>
  )
}
