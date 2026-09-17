'use client'

import { useState } from 'react'
import { AuthGate } from '@/components/auth-gate'
import { Badge, Card, Select } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useQuizStore } from '@/components/quiz-store'
import { ProctoringPanel } from '@/components/admin/proctoring-panel'
import type { Scope17Category, Scope18Category, Scope19Category, Scope28Category, ScopeSector } from '@/lib/types'

const scopeSectors: ScopeSector[] = [
  'NABCB IAF SCOPE 17',
  'NABCB IAF SCOPE 18',
  'NABCB IAF SCOPE 19',
  'NABCB IAF SCOPE 28',
  'Other',
]

const scopeCategories: Record<ScopeSector, string[]> = {
  'NABCB IAF SCOPE 17': [
    'Steel Plates / Sheets / Strips / Flats / Coils', 'Steel Bars / Rods / Wire',
    'Steel Structure Items / Sections', 'Steel Billet / Blooms', 'Steel Forging / Flanges',
    'Steel Fittings', 'Steel Casting', 'Steel Tubes / Pipes / Line Pipes',
    'Welding Rods, Electrodes and Filler Metals', 'Pressure Vessel / Items', 'Heat Exchanger',
    'Piping and Pipe Spool', 'Skids', 'Storage Tank', 'Fabricated Steel Structure',
    'Gas Cylinders', 'Cylinder Cascade', 'Petroleum Gas Dispenser',
    'Un-Pressurized Vessels / Items', 'Drill-through Equipment', 'Wellhead & Tree Equipment',
    'Fired Heaters', 'Bolts / Nuts / Stud', 'Fabricated Items',
  ] satisfies Scope17Category[],
  'NABCB IAF SCOPE 18': [
    'Pump', 'Compressors', 'Fans and Blowers', 'Gear Box',
    'Calibration & Measuring & Testing Equipment', 'Cooling Tower', 'Cranes / Lifting Equipments',
    'Conveyor System', 'Machine Tools / Dies', 'Rotors', 'Valves', 'Dryers', 'Agitators',
    'Appliances', 'HVAC', 'Junction Box / Distribution Box', 'Switch Gears', 'Switch Boards',
    'LT Motors', 'Control Panel', 'Solar PV Modules', 'Solar Panel System', 'UPS', 'Battery',
    'Cable Trays System',
  ] satisfies Scope18Category[],
  'NABCB IAF SCOPE 19': ['Electric Domestic Appliances'] satisfies Scope19Category[],
  'NABCB IAF SCOPE 28': ['Building Construction'] satisfies Scope28Category[],
  Other: ['Other'],
}

export default function AdminInspectorsPage() {
  return (
    <AuthGate role="admin">
      <InspectorInformation />
    </AuthGate>
  )
}

function InspectorInformation() {
  const { users, quizzes, trainingResources, updateUser, proctoringSessions, deleteProctoringSession } = useQuizStore()
  const [activeTab, setActiveTab] = useState<'information' | 'assignment' | 'monitoring'>('information')
  const people = users.filter((user) => user.role === 'inspector')
  const [selectedUserId, setSelectedUserId] = useState(people[0]?.id ?? '')
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [selectedTrainingId, setSelectedTrainingId] = useState('')
  const [conductedBy, setConductedBy] = useState('Technical Manager')
  const initialUser = people[0]
  const [name, setName] = useState(initialUser?.name ?? '')
  const [designation, setDesignation] = useState(initialUser?.designation ?? '')
  const [scopeSector, setScopeSector] = useState<ScopeSector | ''>(initialUser?.scopeSector ?? '')
  const [scopeCategory, setScopeCategory] = useState(initialUser?.scope17Category ?? initialUser?.scope18Category ?? initialUser?.scope19Category ?? initialUser?.scope28Category ?? '')
  const [message, setMessage] = useState<string | null>(null)

  const selectedUser = people.find((user) => user.id === selectedUserId)
  const selectedCategories = scopeSector ? scopeCategories[scopeSector] : []
  const availableTests = quizzes.filter(
    (quiz) => quiz.targetRole === selectedUser?.role,
  )

  function selectPerson(id: string) {
    const user = people.find((person) => person.id === id)
    setSelectedUserId(id)
    setSelectedQuizId('')
    setName(user?.name ?? '')
    setDesignation(user?.designation ?? '')
    setScopeSector(user?.scopeSector ?? '')
    setScopeCategory(user?.scope17Category ?? user?.scope18Category ?? user?.scope19Category ?? user?.scope28Category ?? '')
    setMessage(null)
  }

  function saveInformation() {
    if (!selectedUser || !name.trim() || !designation.trim() || !scopeSector || !scopeCategory) {
      setMessage('Complete all inspector information and select a scope category.')
      return
    }
    updateUser(selectedUser.id, {
      name: name.trim(),
      designation: designation.trim(),
      scopeSector,
      scope17Category: scopeSector === 'NABCB IAF SCOPE 17' ? scopeCategory as Scope17Category : undefined,
      scope18Category: scopeSector === 'NABCB IAF SCOPE 18' ? scopeCategory as Scope18Category : undefined,
      scope19Category: scopeSector === 'NABCB IAF SCOPE 19' ? scopeCategory as Scope19Category : undefined,
      scope28Category: scopeSector === 'NABCB IAF SCOPE 28' ? scopeCategory as Scope28Category : undefined,
    })
    setMessage('Inspector information saved.')
  }

  function assignTest() {
    if (!selectedUser || !selectedQuizId) {
      setMessage('Select an inspector and a test first.')
      return
    }
    const assignedQuizIds = Array.from(new Set([...(selectedUser.assignedQuizIds ?? []), selectedQuizId]))
    const testAssignments = [
      ...(selectedUser.testAssignments ?? []).filter((assignment) => assignment.quizId !== selectedQuizId),
      { quizId: selectedQuizId, conductedBy: conductedBy.trim() || 'Technical Manager', assignedAt: Date.now() },
    ]
    updateUser(selectedUser.id, { assignedQuizIds, testAssignments })
    setMessage('Test assigned successfully.')
  }

  function removeAssignment(quizId: string) {
    if (!selectedUser) return
    updateUser(selectedUser.id, {
      assignedQuizIds: (selectedUser.assignedQuizIds ?? []).filter((id) => id !== quizId),
      testAssignments: (selectedUser.testAssignments ?? []).filter((assignment) => assignment.quizId !== quizId),
    })
    setMessage('Assignment removed.')
  }

  function assignTraining() {
    if (!selectedUser || !selectedTrainingId) {
      setMessage('Select an inspector and a training resource first.')
      return
    }
    updateUser(selectedUser.id, { assignedTrainingIds: Array.from(new Set([...(selectedUser.assignedTrainingIds ?? []), selectedTrainingId])) })
    setMessage('Training assigned successfully.')
  }

  function removeTrainingAssignment(trainingId: string) {
    if (!selectedUser) return
    updateUser(selectedUser.id, { assignedTrainingIds: (selectedUser.assignedTrainingIds ?? []).filter((id) => id !== trainingId) })
    setMessage('Training assignment removed.')
  }

  async function deleteFootage(session: typeof proctoringSessions[number]) {
    if (!session.recordingId || !window.confirm(`Delete the monitoring footage for ${session.userName}?`)) return
    const result = await deleteProctoringSession(session.id)
    setMessage(result.ok ? 'Monitoring footage deleted.' : result.error ?? 'The footage could not be deleted.')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Inspector information</h1>
        <p className="text-sm text-muted-foreground">
          Review information submitted before the test and assign a specific test to an inspector or user.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button type="button" onClick={() => setActiveTab('information')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'information' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
          Inspector information
        </button>
        <button type="button" onClick={() => setActiveTab('assignment')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'assignment' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
          Assign test
        </button>
        <button type="button" onClick={() => setActiveTab('monitoring')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'monitoring' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
          Live monitoring & footage
        </button>
      </div>

      {activeTab === 'monitoring' ? (
        <ProctoringPanel sessions={proctoringSessions} onDelete={deleteFootage} />
      ) : activeTab === 'information' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
          <Card className="flex flex-col gap-5">
            <div>
              <h2 className="font-heading text-lg font-semibold">Inspector information</h2>
              <p className="mt-1 text-sm text-muted-foreground">The Technical Manager can fill or update inspector information here.</p>
            </div>
            <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Inspector or user</span><Select value={selectedUserId} onChange={(event) => selectPerson(event.target.value)}><option value="">Select a person</option>{people.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}</Select></label>
            <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Name</span><input className="h-11 rounded-xl border border-border bg-background px-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Designation</span><input className="h-11 rounded-xl border border-border bg-background px-3 text-sm" value={designation} onChange={(event) => setDesignation(event.target.value)} /></label>
            <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Scope sector</span><Select value={scopeSector} onChange={(event) => { setScopeSector(event.target.value as ScopeSector); setScopeCategory('') }}><option value="">Select scope sector</option>{scopeSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</Select></label>
            {scopeSector && <label className="flex flex-col gap-1.5"><span className="text-sm font-semibold">Scope category</span><Select value={scopeCategory} onChange={(event) => setScopeCategory(event.target.value)}><option value="">Select scope category</option>{selectedCategories.map((category, index) => <option key={category} value={category}>{index + 1}. {category}</option>)}</Select></label>}
            <Button onClick={saveInformation}>Save information</Button>
            {message && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}
          </Card>
          {selectedUser ? <Card className="flex flex-col gap-3"><Badge tone="primary">{selectedUser.role}</Badge><h2 className="font-heading text-lg font-semibold">{selectedUser.name}</h2><p className="text-sm text-muted-foreground">{selectedUser.email}</p><p className="text-sm"><strong>Scope:</strong> {selectedUser.scopeSector || 'Not provided'}</p><p className="text-sm"><strong>Category:</strong> {selectedUser.scope17Category || selectedUser.scope18Category || selectedUser.scope19Category || selectedUser.scope28Category || 'Not provided'}</p></Card> : <Card className="py-12 text-center text-sm text-muted-foreground">Select a person to view their information.</Card>}
        </div>
      ) : (
      <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <Card className="flex flex-col gap-5">
          <div>
            <h2 className="font-heading text-lg font-semibold">Inspector assignment</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the person and the test they should complete.</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Inspector or user</span>
            <Select value={selectedUserId} onChange={(event) => selectPerson(event.target.value)}>
              <option value="">Select a person</option>
              {people.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Test</span>
            <Select value={selectedQuizId} onChange={(event) => setSelectedQuizId(event.target.value)}>
              <option value="">Select a test</option>
              {availableTests.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Test conducted by</span>
            <input className="h-11 rounded-xl border border-border bg-background px-3 text-sm" value={conductedBy} onChange={(event) => setConductedBy(event.target.value)} placeholder="Technical Manager" />
          </label>
          <Button onClick={assignTest}>Assign test</Button>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Training</span>
            <div className="flex gap-2">
              <Select className="min-w-0 flex-1" value={selectedTrainingId} onChange={(event) => setSelectedTrainingId(event.target.value)}>
                <option value="">Select training resource</option>
                {trainingResources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
              </Select>
              <Button onClick={assignTraining}>Assign</Button>
            </div>
          </label>
          {message && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}
        </Card>

        {selectedUser ? (
          <Card className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="primary">{selectedUser.role}</Badge>
                <h2 className="mt-2 font-heading text-lg font-semibold">{selectedUser.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <p><strong>Designation:</strong> {selectedUser.designation || 'Not provided'}</p>
              <p><strong>Scope sector:</strong> {selectedUser.scopeSector || 'Not provided'}</p>
              <p><strong>Scope category:</strong> {selectedUser.scope17Category || selectedUser.scope18Category || selectedUser.scope19Category || selectedUser.scope28Category || 'Not provided'}</p>
            </div>
          </Card>
        ) : (
          <Card className="py-12 text-center text-sm text-muted-foreground">Select a person to view their information.</Card>
        )}
      </div>

      {selectedUser && (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Assigned tests</h2>
              <p className="text-sm text-muted-foreground">Only these tests are shown when assignments exist.</p>
            </div>
            <Badge tone="neutral">{selectedUser.assignedQuizIds?.length ?? 0} assigned</Badge>
          </div>
          {(selectedUser.assignedQuizIds?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No tests assigned to this inspector.</p>
          ) : (
            <ul className="divide-y divide-border">
              {selectedUser.assignedQuizIds?.map((quizId) => {
                const quiz = quizzes.find((item) => item.id === quizId)
                if (!quiz) return null
                return (
                  <li key={quiz.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm font-medium">{quiz.title}<span className="block text-xs font-normal text-muted-foreground">Conducted by: {selectedUser.testAssignments?.find((assignment) => assignment.quizId === quiz.id)?.conductedBy ?? 'Technical Manager'}</span></span>
                    <Button variant="ghost" size="sm" onClick={() => removeAssignment(quiz.id)}>Remove</Button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}
      {selectedUser && (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Assigned training</h2>
              <p className="text-sm text-muted-foreground">Only these resources are visible to this inspector.</p>
            </div>
            <Badge tone="neutral">{selectedUser.assignedTrainingIds?.length ?? 0} assigned</Badge>
          </div>
          {(selectedUser.assignedTrainingIds?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">No training assigned to this inspector.</p> : <ul className="divide-y divide-border">{selectedUser.assignedTrainingIds?.map((trainingId) => { const resource = trainingResources.find((item) => item.id === trainingId); if (!resource) return null; return <li key={resource.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm font-medium">{resource.title}</span><Button variant="ghost" size="sm" onClick={() => removeTrainingAssignment(resource.id)}>Remove</Button></li> })}</ul>}
        </Card>
      )}
      </>
      )}
    </div>
  )
}
