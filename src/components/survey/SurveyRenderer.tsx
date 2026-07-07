'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Send, Loader2, CheckCircle2, LogOut, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { evaluateRelevance } from '@/lib/relevance/evaluator';
import { interpolate } from '@/lib/piping/interpolate';
import { QuestionField } from './QuestionField';
import type { RelevanceExpression, AnswerMap } from '@/types';

interface Choice {
  id: string;
  code: string;
  label: string;
  value: string;
  sortOrder: number;
}

interface Question {
  id: string;
  code: string;
  text: string;
  helpText: string | null;
  type: string;
  isRequired: boolean;
  relevance: RelevanceExpression;
  equation: string | null;
  choices: Choice[];
}

interface Group {
  id: string;
  title: string;
  description: string | null;
  relevance: RelevanceExpression;
  questions: Question[];
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  welcomeText: string | null;
  endText: string | null;
  allowBack: boolean;
  requireToken: boolean;
  groups: Group[];
}

export function SurveyRenderer({ 
  survey, 
  isPreview = false, 
  token,
  initialData,
  userEmail
}: { 
  survey: Survey; 
  isPreview?: boolean; 
  token?: string;
  initialData?: { responseId: string; answers: any; currentPage: number };
  userEmail?: string;
}) {
  const [currentPage, setCurrentPage] = useState(initialData ? initialData.currentPage : -1); // -1 = welcome page
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialData ? initialData.answers : {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

  const [responseId, setResponseId] = useState<string | null>(initialData ? initialData.responseId : null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Autosave
  useEffect(() => {
    if (currentPage === -1 || isComplete || isPreview || !responseId) return;

    setSaveStatus('saving');
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/surveys/${survey.id}/responses/${responseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partialData: answers, lastPage: currentPage })
        });
        if (res.ok) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        setSaveStatus('error');
      }
    }, 2500);

    return () => clearTimeout(handler);
  }, [answers, currentPage, survey.id, responseId, isComplete, isPreview]);

  // Session start
  useEffect(() => {
    if (!isPreview && !responseId && currentPage >= 0 && !isComplete) {
      fetch(`/api/surveys/${survey.id}/responses/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantToken: token })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setResponseId(data.data.rid);
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('rid', data.data.rid);
          window.history.replaceState(null, '', newUrl.toString());
        }
      })
      .catch(console.error);
    }
  }, [isPreview, responseId, currentPage, survey.id, token, isComplete]);

  // Build AnswerMap for relevance/piping
  const answerMap: AnswerMap = useMemo(() => {
    return new Map(Object.entries(answers));
  }, [answers]);

  // Filter groups by relevance
  const visibleGroups = useMemo(() => {
    return survey.groups.filter((g) =>
      evaluateRelevance(g.relevance, answerMap)
    );
  }, [survey.groups, answerMap]);

  // Filter questions by relevance for current group
  const currentGroup = visibleGroups[currentPage] ?? null;
  const visibleQuestions = useMemo(() => {
    if (!currentGroup) return [];
    return currentGroup.questions.filter((q) =>
      evaluateRelevance(q.relevance, answerMap)
    );
  }, [currentGroup, answerMap]);

  const totalPages = visibleGroups.length;
  const isLastPage = currentPage === totalPages - 1;
  const isWelcomePage = currentPage === -1;

  // Update an answer
  const setAnswer = useCallback((questionCode: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionCode]: value }));
    setValidationErrors((prev) => {
      const next = new Set(prev);
      next.delete(questionCode);
      return next;
    });
  }, []);

  // Validate current page required fields
  const validateCurrentPage = (): boolean => {
    const errors = new Set<string>();
    for (const q of visibleQuestions) {
      if (q.isRequired) {
        const val = answers[q.code];
        if (!val || (Array.isArray(val) && val.length === 0) || val === '') {
          errors.add(q.code);
        }
      }
    }
    setValidationErrors(errors);
    return errors.size === 0;
  };

  // Navigation
  const goNext = () => {
    if (isWelcomePage) {
      setCurrentPage(0);
      return;
    }
    if (!validateCurrentPage()) return;
    if (isLastPage) {
      handleSubmit();
    } else {
      setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
    }
  };

  const goBack = () => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    } else if (currentPage === 0 && survey.welcomeText) {
      setCurrentPage(-1);
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateCurrentPage()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Build answers array from all visible questions across all groups
      const allQuestions = survey.groups.flatMap((g) => g.questions);
      const submitAnswers = allQuestions
        .filter((q) => answers[q.code] !== undefined)
        .map((q) => {
          const val = answers[q.code];
          let textValue = null;
          let choiceValues: string[] = [];
          let numericValue = null;

          if (q.type === 'SINGLE_CHOICE' || q.type === 'DROPDOWN') {
            if (typeof val === 'string') choiceValues = [val];
          } else if (q.type === 'MULTIPLE_CHOICE') {
            if (Array.isArray(val)) choiceValues = val;
          } else if (q.type === 'RATING') {
            if (typeof val === 'string' || typeof val === 'number') numericValue = Number(val);
          } else if (q.type === 'TEXT_SHORT' || q.type === 'TEXT_LONG') {
            if (typeof val === 'string') textValue = val;
          }

          return {
            questionId: q.id,
            textValue,
            choiceValues,
            numericValue,
          };
        });

      if (isPreview) {
        // Simulate a delay for preview
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else if (responseId) {
        const res = await fetch(`/api/surveys/${survey.id}/responses/${responseId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: submitAnswers, participantToken: token }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Échec de la soumission');
        }
      } else {
        throw new Error('Identifiant de session manquant');
      }

      setIsComplete(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur s\'est produite');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Completion screen
  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="animate-fade-in text-center max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-200">
            {isPreview ? 'Sondage de test terminé' : 'Sondage terminé'}
          </h1>
          <div className="mt-4 text-zinc-400">
            {isPreview && (
              <div className="mb-4 rounded bg-yellow-400/10 px-4 py-2 text-sm text-yellow-400">
                Ceci était un test. Aucune réponse n'a été enregistrée en base de données.
              </div>
            )}
            {survey.endText ? (
              <p>{interpolate(survey.endText, answerMap)}</p>
            ) : (
              <p>Votre réponse a été enregistrée. Merci pour votre participation !</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Welcome screen
  if (isWelcomePage && survey.welcomeText) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
        {userEmail && (
          <div className="absolute top-4 right-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-2">
            <span className="text-sm font-medium text-zinc-300">{userEmail}</span>
            <button
              onClick={() => signOut({ callbackUrl: `/s/${survey.slug}/login` })}
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        )}
        <div className="animate-fade-in w-full max-w-2xl mt-12">
          <div className="glass-card rounded-2xl p-8 md:p-12">
            <h1 className="lemon-gradient-text text-3xl font-bold">{survey.title}</h1>
            {survey.description && (
              <p className="mt-3 text-zinc-400">{survey.description}</p>
            )}
            <div className="mt-6 text-zinc-300 leading-relaxed">
              {survey.welcomeText}
            </div>
            <button
              onClick={goNext}
              className="mt-8 flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-3 text-sm font-semibold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 active:scale-[0.98]"
            >
              Commencer le sondage
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If on welcome page but no welcome text, auto-advance
  if (isWelcomePage) {
    setCurrentPage(0);
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      {/* User Status Bar */}
      {userEmail && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500">Connecté en tant que</span>
              <span className="text-sm font-medium text-zinc-300">{userEmail}</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: `/s/${survey.slug}/login` })}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-2">
            {survey.title}
            {isPreview && (
              <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 font-semibold text-yellow-400 uppercase">
                Mode Test
              </span>
            )}
          </span>
          <span>
            Page {currentPage + 1} sur {totalPages}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
          />
        </div>
      </div>

      {/* Group Title */}
      {currentGroup && (
        <div className="animate-fade-in mb-8">
          <h2 className="text-xl font-bold text-zinc-200">{currentGroup.title}</h2>
          {currentGroup.description && (
            <p className="mt-2 text-sm text-zinc-400">{currentGroup.description}</p>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {visibleQuestions.map((question) => (
          <div key={question.id} className="animate-slide-in">
            <QuestionField
              question={question}
              value={answers[question.code]}
              onChange={(val) => setAnswer(question.code, val)}
              answerMap={answerMap}
              hasError={validationErrors.has(question.code)}
            />
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {survey.allowBack && currentPage > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
          )}
          
          {/* Save Status Indicator */}
          {!isPreview && (
            <div className="hidden sm:flex">
              {saveStatus === 'saving' && <span className="text-xs text-zinc-500 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin"/> Sauvegarde automatique...</span>}
              {saveStatus === 'saved' && <span className="text-xs text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3"/> Brouillon sauvegardé</span>}
              {saveStatus === 'error' && <span className="text-xs text-red-500 flex items-center gap-1.5">Erreur de sauvegarde</span>}
            </div>
          )}
        </div>
        <button
          onClick={goNext}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Soumission...
            </>
          ) : isLastPage ? (
            <>
              Soumettre le sondage
              <Send className="h-4 w-4" />
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
