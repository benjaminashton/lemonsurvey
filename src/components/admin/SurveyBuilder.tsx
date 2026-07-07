'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Eye, Users, Table, Webhook, Play, CheckCircle2, Share, X, Send, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroupPanel } from './GroupPanel';
import { QuestionEditor } from './QuestionEditor';

function replaceVariables(obj: any, map: Record<string, string>): any {
  if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item, map));
  } else if (obj !== null && typeof obj === 'object') {
    if (obj.var && typeof obj.var === 'string' && map[obj.var]) {
      return { ...obj, var: map[obj.var] };
    }
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = replaceVariables(obj[key], map);
    }
    return newObj;
  }
  return obj;
}

function replaceInEquation(eq: string | null, map: Record<string, string>): string | null {
  if (!eq) return eq;
  const keys = Object.keys(map);
  if (keys.length === 0) return eq;
  const regex = new RegExp(`\\b(${keys.join('|')})\\b`, 'g');
  return eq.replace(regex, match => map[match]);
}

// Types matching Prisma includes
interface Choice {
  id: string;
  code: string;
  label: string;
  value: string;
  sortOrder: number;
  attachedAsset: Record<string, unknown> | null;
}

interface Question {
  id: string;
  groupId: string;
  code: string;
  text: string;
  helpText: string | null;
  type: string;
  isRequired: boolean;
  sortOrder: number;
  relevance: Record<string, unknown> | null;
  equation: string | null;
  defaultValue: string | null;
  validation: Record<string, unknown> | null;
  choices: Choice[];
}

interface Group {
  id: string;
  surveyId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  relevance: Record<string, unknown> | null;
  questions: Question[];
}

interface Survey {
  id: string;
  title: string;
  slug: string;
  status: string;
  groups: Group[];
}

export type { Choice, Question, Group, Survey };

export function SurveyBuilder({ initialSurvey }: { initialSurvey: Survey }) {
  const [survey, setSurvey] = useState<Survey>(initialSurvey);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareSubject, setShareSubject] = useState('');
  const [shareMessageText, setShareMessageText] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Find selected question across all groups
  const selectedQuestion =
    survey.groups.flatMap((g) => g.questions).find((q) => q.id === selectedQuestionId) ?? null;

  const selectedGroup = selectedQuestion
    ? survey.groups.find((g) => g.id === selectedQuestion.groupId) ?? null
    : null;

  // Refresh survey data from server
  const refreshSurvey = useCallback(async () => {
    try {
      const res = await fetch(`/api/surveys/${survey.id}`);
      if (res.ok) {
        const data = await res.json();
        setSurvey(data.data);
      }
    } catch (e) {
      console.error('Failed to refresh survey:', e);
    }
  }, [survey.id]);

  const applyCodeRecalculation = useCallback((newGroups: Group[], skipSave = false) => {
    let qCounter = 1;
    let pCounter = 1;
    const codeMap: Record<string, string> = {};

    newGroups.forEach(g => {
      g.questions.forEach(q => {
        const oldCode = q.code;
        let newCode = oldCode;
        if (q.type === 'PRESENTATION') {
          newCode = `P${pCounter++}`;
        } else {
          newCode = `Q${qCounter++}`;
        }
        if (oldCode !== newCode) {
          codeMap[oldCode] = newCode;
          q.code = newCode;
        }
      });
    });

    if (Object.keys(codeMap).length > 0) {
      newGroups.forEach(g => {
        if (g.relevance) g.relevance = replaceVariables(g.relevance, codeMap);
        g.questions.forEach(q => {
          if (q.relevance) q.relevance = replaceVariables(q.relevance, codeMap);
          if (q.equation) q.equation = replaceInEquation(q.equation, codeMap);
        });
      });
    }

    if (!skipSave) {
      const questionsPayload = newGroups.flatMap(g => 
        g.questions.map((q, i) => ({
          id: q.id,
          sortOrder: i,
          groupId: g.id,
          code: q.code,
          relevance: q.relevance,
          equation: q.equation
        }))
      );

      fetch(`/api/surveys/${survey.id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsPayload }),
      }).catch(console.error);
    }
    return newGroups;
  }, [survey.id]);

  // Add a new group
  const addGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/surveys/${survey.id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Page ${survey.groups.length + 1}` }),
      });
      if (res.ok) {
        await refreshSurvey();
      }
    } catch (e) {
      console.error('Failed to add group:', e);
    }
  }, [survey.id, survey.groups.length, refreshSurvey]);

  // Delete a group
  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (selectedQuestion?.groupId === groupId) {
        setSelectedQuestionId(null);
      }
      try {
        const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
        if (res.ok) {
          await refreshSurvey();
        }
      } catch (e) {
        console.error('Failed to delete group:', e);
      }
    },
    [selectedQuestion?.groupId, refreshSurvey]
  );

  // Update a group title
  const updateGroup = useCallback(
    async (groupId: string, data: { title?: string; description?: string; relevance?: any }) => {
      try {
        const res = await fetch(`/api/groups/${groupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await refreshSurvey();
        }
      } catch (e) {
        console.error('Failed to update group:', e);
      }
    },
    [refreshSurvey]
  );

  // Add a question to a group
  const addQuestion = useCallback(
    async (groupId: string, type: string) => {
      const allQuestions = survey.groups.flatMap((g) => g.questions);
      const qCount = allQuestions.filter(q => q.type !== 'PRESENTATION').length;
      const code = `Q${qCount + 1}`;

      const defaultChoices = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(type)
        ? [
            { code: 'A1', label: 'Option 1', value: 'option_1', sortOrder: 0 },
            { code: 'A2', label: 'Option 2', value: 'option_2', sortOrder: 1 },
          ]
        : undefined;

      try {
        const res = await fetch(`/api/groups/${groupId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            text: 'Nouvelle question',
            type,
            choices: defaultChoices,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const newQuestion = data.data;

          setSurvey(prev => {
            const newGroups = prev.groups.map(g => {
              if (g.id === groupId) {
                 return { ...g, questions: [...g.questions, newQuestion] };
              }
              return { ...g, questions: [...g.questions] };
            });

            return { ...prev, groups: applyCodeRecalculation(newGroups) };
          });

          setSelectedQuestionId(newQuestion.id);
        }
      } catch (e) {
        console.error('Failed to add question:', e);
      }
    },
    [survey.groups, refreshSurvey]
  );

  // Update a question
  const updateQuestion = useCallback(
    async (questionId: string, data: Record<string, unknown>) => {
      setIsSaving(true);
      setSaveMessage(null);
      try {
        // Auto-update code if type changes between PRESENTATION and others
        if (data.type) {
          const allQuestions = survey.groups.flatMap(g => g.questions);
          const currentQ = allQuestions.find(q => q.id === questionId);
          
          if (currentQ && currentQ.type !== data.type) {
            if (data.type === 'PRESENTATION') {
              const pCount = allQuestions.filter(q => q.type === 'PRESENTATION' && q.id !== questionId).length;
              data.code = `P${pCount + 1}`;
            } else if (currentQ.type === 'PRESENTATION') {
              const qCount = allQuestions.filter(q => q.type !== 'PRESENTATION' && q.id !== questionId).length;
              data.code = `Q${qCount + 1}`;
            }
          }
        }

        const res = await fetch(`/api/questions/${questionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await refreshSurvey();
          setSaveMessage('Enregistré');
          setTimeout(() => setSaveMessage(null), 2000);
        }
      } catch (e) {
        console.error('Failed to update question:', e);
        setSaveMessage('Erreur d\'enregistrement');
      } finally {
        setIsSaving(false);
      }
    },
    [survey.id, refreshSurvey]
  );

  const openShareModal = () => {
    setShareEmail('');
    setShareSubject(`Invitation à participer au sondage : ${survey.title}`);
    setShareMessageText(`Bonjour,\n\nVoici un lien pour participer au sondage "${survey.title}" :\n${window.location.origin}/s/${survey.slug}\n\nMerci d'avance pour votre participation !`);
    setIsShareModalOpen(true);
  };

  const handleShare = async () => {
    if (!shareEmail || !shareSubject || !shareMessageText) return;
    setIsSharing(true);
    try {
      const res = await fetch(`/api/surveys/${survey.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareEmail, subject: shareSubject, message: shareMessageText })
      });
      if (res.ok) {
        setIsShareModalOpen(false);
        setSaveMessage('Sondage partagé avec succès !');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors du partage');
      }
    } catch (e) {
      alert('Erreur lors du partage');
    }
    setIsSharing(false);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/s/${survey.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  // Delete a question
  const deleteQuestion = useCallback(
    async (questionId: string) => {
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(null);
      }
      try {
        const res = await fetch(`/api/questions/${questionId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setSurvey(prev => {
            const newGroups = prev.groups.map(g => ({
              ...g,
              questions: g.questions.filter(q => q.id !== questionId)
            }));
            return { ...prev, groups: applyCodeRecalculation(newGroups) };
          });
        }
      } catch (e) {
        console.error('Failed to delete question:', e);
      }
    },
    [selectedQuestionId, refreshSurvey]
  );

  const moveQuestion = useCallback(
    async (sourceId: string, targetId: string, isGroupDrop?: boolean) => {
      setSurvey((prev) => {
        // Create a deep copy of groups to mutate
        const newGroups = prev.groups.map(g => ({
          ...g,
          questions: [...g.questions],
        }));

        let sourceGroupIdx = -1;
        let sourceQIdx = -1;
        let sourceQuestion = null;

        for (let i = 0; i < newGroups.length; i++) {
          const idx = newGroups[i].questions.findIndex(q => q.id === sourceId);
          if (idx !== -1) {
            sourceGroupIdx = i;
            sourceQIdx = idx;
            sourceQuestion = newGroups[i].questions[idx];
            break;
          }
        }

        if (!sourceQuestion) return prev;

        // Remove source
        newGroups[sourceGroupIdx].questions.splice(sourceQIdx, 1);

        if (isGroupDrop) {
          const targetGroup = newGroups.find(g => g.id === targetId);
          if (targetGroup) targetGroup.questions.push(sourceQuestion);
        } else {
          let targetGroupIdx = -1;
          let targetQIdx = -1;
          for (let i = 0; i < newGroups.length; i++) {
            const idx = newGroups[i].questions.findIndex(q => q.id === targetId);
            if (idx !== -1) {
              targetGroupIdx = i;
              targetQIdx = idx;
              break;
            }
          }
          if (targetGroupIdx !== -1) {
            // Insert at target index (which pushes target down)
            newGroups[targetGroupIdx].questions.splice(targetQIdx, 0, sourceQuestion);
          } else {
            // Fallback (e.g. target not found somehow)
            newGroups[sourceGroupIdx].questions.splice(sourceQIdx, 0, sourceQuestion);
          }
        }

        // Apply code recalculation and trigger update
        return { ...prev, groups: applyCodeRecalculation(newGroups) };
      });
    },
    [refreshSurvey]
  );

  const handlePublish = async () => {
    if (!confirm('Voulez-vous vraiment finaliser ce sondage ? Une fois actif, vous pourrez le partager.')) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (res.ok) {
        await refreshSurvey();
        setSaveMessage('Sondage publié');
        setTimeout(() => setSaveMessage(null), 2000);
      }
    } catch (e) {
      console.error('Failed to publish:', e);
      setSaveMessage('Erreur de publication');
    } finally {
      setIsSaving(false);
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-zinc-700 text-zinc-300',
    ACTIVE: 'bg-emerald-400/15 text-emerald-400',
    CLOSED: 'bg-red-400/15 text-red-400',
    ARCHIVED: 'bg-zinc-600 text-zinc-400',
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      {/* Top Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/surveys"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Sondages
          </Link>
          <div className="h-5 w-px bg-zinc-800" />
          <h1 className="truncate max-w-[300px] text-sm font-semibold text-zinc-200">
            {survey.title}
          </h1>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              statusColors[survey.status] ?? statusColors.DRAFT
            )}
          >
            {{
              DRAFT: 'BROUILLON',
              ACTIVE: 'ACTIF',
              CLOSED: 'FERMÉ',
              ARCHIVED: 'ARCHIVÉ',
            }[survey.status] ?? survey.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-zinc-800 pr-3">
            <a
              href={`/s/${survey.slug}?preview=true`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-white"
            >
              <Play className="h-4 w-4" />
              Tester
            </a>
            {survey.status === 'DRAFT' ? (
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finaliser
              </button>
            ) : (
              <button
                onClick={openShareModal}
                className="flex items-center gap-1.5 rounded-lg bg-yellow-400/10 px-3 py-1.5 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-400/20"
              >
                <Share className="h-4 w-4" />
                Partager
              </button>
            )}
          </div>
          
          <Link
            href={`/surveys/${survey.id}/routing`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
          >
            <Webhook className="h-4 w-4" />
            Routage
          </Link>
          <Link
            href={`/surveys/${survey.id}/responses`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
          >
            <Table className="h-4 w-4" />
            Réponses
          </Link>

          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className="animate-fade-in text-xs text-emerald-400">{saveMessage}</span>
            )}
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />}
          </div>
        </div>
      </div>

      {/* Split Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <GroupPanel
          groups={survey.groups}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={setSelectedQuestionId}
          onAddGroup={addGroup}
          onDeleteGroup={deleteGroup}
          onUpdateGroup={updateGroup}
          onAddQuestion={addQuestion}
          onDeleteQuestion={deleteQuestion}
          onMoveQuestion={moveQuestion}
        />

        {/* Right Panel */}
        <div className="flex-1 overflow-y-auto bg-zinc-900/30">
          {selectedQuestion ? (
            <QuestionEditor
              key={selectedQuestion.id}
              question={selectedQuestion}
              groupTitle={selectedGroup?.title ?? ''}
              availableQuestions={survey.groups.flatMap((g) => g.questions).filter(q => q.type !== 'PRESENTATION').map((q) => ({
                code: q.code,
                text: q.text,
                type: q.type,
                choices: q.choices,
              }))}
              onSave={(data) => updateQuestion(selectedQuestion.id, data)}
              onDelete={() => deleteQuestion(selectedQuestion.id)}
              isSaving={isSaving}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-zinc-600">
              <Eye className="mb-3 h-12 w-12" />
              <p className="text-lg font-medium text-zinc-500">Aucune question sélectionnée</p>
              <p className="mt-1 text-sm text-zinc-600">
                Sélectionnez une question dans le panneau de gauche pour la modifier
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-100">Partager le sondage</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6 space-y-2">
              <label className="block text-sm font-medium text-zinc-400">Lien universel</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/s/${survey.slug}`}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-400 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex h-[42px] items-center gap-2 rounded-xl bg-zinc-800 px-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {isCopied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-950 px-2 text-zinc-500">Ou envoyer par email</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-400">Email du destinataire</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-yellow-400/50 focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-400">Sujet</label>
                <input
                  type="text"
                  value={shareSubject}
                  onChange={(e) => setShareSubject(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 focus:border-yellow-400/50 focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-400">Message</label>
                <textarea
                  value={shareMessageText}
                  onChange={(e) => setShareMessageText(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200 focus:border-yellow-400/50 focus:outline-none focus:ring-1 focus:ring-yellow-400/50"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              >
                Annuler
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing || !shareEmail}
                className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-50"
              >
                {isSharing && <Loader2 className="h-4 w-4 animate-spin" />}
                Envoyer
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
