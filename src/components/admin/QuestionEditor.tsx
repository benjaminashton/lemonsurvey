'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  Trash2,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Upload as UploadIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question, Choice } from './SurveyBuilder';
import { RelevanceEditor } from './RelevanceEditor';
import type { RelevanceExpression } from '@/types';

const questionTypeLabels: Record<string, string> = {
  SINGLE_CHOICE: 'Choix unique',
  MULTIPLE_CHOICE: 'Choix multiple',
  DROPDOWN: 'Menu déroulant',
  TEXT_SHORT: 'Texte court',
  TEXT_LONG: 'Texte long',
  RATING: 'Évaluation',
  FILE_UPLOAD: 'Téléversement de fichier',
  EQUATION: 'Équation / Caché',
  PRESENTATION: 'Présentation / Information',
};

const CHOICE_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'];

interface QuestionEditorProps {
  question: Question;
  groupTitle: string;
  availableQuestions: { code: string; text: string; type: string; choices: { code: string; label: string; value: string }[] }[];
  onSave: (data: Record<string, unknown>) => void;
  onDelete: () => void;
  isSaving: boolean;
}

export function QuestionEditor({
  question,
  groupTitle,
  availableQuestions,
  onSave,
  onDelete,
  isSaving,
}: QuestionEditorProps) {
  const [code, setCode] = useState(question.code);
  const [text, setText] = useState(question.text);
  const [helpText, setHelpText] = useState(question.helpText ?? '');
  const [type, setType] = useState(question.type);
  const [isRequired, setIsRequired] = useState(question.isRequired);
  const [equation, setEquation] = useState(question.equation ?? '');
  const [defaultValue, setDefaultValue] = useState(question.defaultValue ?? '');
  const [choices, setChoices] = useState<Choice[]>(question.choices ?? []);
  const [relevance, setRelevance] = useState<RelevanceExpression>(
    (question.relevance as RelevanceExpression) ?? null
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Track changes
  useEffect(() => {
    const changed =
      code !== question.code ||
      text !== question.text ||
      helpText !== (question.helpText ?? '') ||
      type !== question.type ||
      isRequired !== question.isRequired ||
      equation !== (question.equation ?? '') ||
      defaultValue !== (question.defaultValue ?? '') ||
      JSON.stringify(choices) !== JSON.stringify(question.choices ?? []) ||
      JSON.stringify(relevance) !== JSON.stringify(question.relevance ?? null);
    setHasChanges(!!changed);
  }, [code, text, helpText, type, isRequired, equation, defaultValue, choices, relevance, question]);

  const handleSave = () => {
    const data: Record<string, unknown> = {
      code,
      text,
      helpText: helpText || null,
      type,
      isRequired,
      relevance,
      defaultValue: defaultValue || null,
    };

    if (type === 'EQUATION') {
      data.equation = equation || null;
    }

    if (CHOICE_TYPES.includes(type)) {
      data.choices = choices.map((c, i) => ({
        code: c.code,
        label: c.label,
        value: c.value,
        sortOrder: i,
        attachedAsset: c.attachedAsset,
      }));
    }

    onSave(data);
    setHasChanges(false);
  };

  const addChoice = () => {
    const nextNum = choices.length + 1;
    setChoices([
      ...choices,
      {
        id: `temp-${Date.now()}`,
        code: `A${nextNum}`,
        label: `Option ${nextNum}`,
        value: `option_${nextNum}`,
        sortOrder: choices.length,
        attachedAsset: null,
      },
    ]);
  };

  const updateChoice = (index: number, field: keyof Choice, value: string) => {
    setChoices((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const removeChoice = (index: number) => {
    setChoices((prev) => prev.filter((_, i) => i !== index));
  };

  const moveChoice = (index: number, direction: 'up' | 'down') => {
    const newChoices = [...choices];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newChoices.length) return;
    [newChoices[index], newChoices[targetIndex]] = [
      newChoices[targetIndex],
      newChoices[index],
    ];
    setChoices(newChoices);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setDefaultValue(result.data.url);
      } else {
        alert(result.error || 'Erreur lors du téléversement');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setDefaultValue(result.data.url);
      } else {
        alert(result.error || 'Erreur lors du téléversement');
      }
    } catch (err) {
      alert('Erreur réseau');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs text-zinc-500">{groupTitle}</p>
          <h2 className="text-lg font-semibold text-zinc-200">Edit Question</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Delete this question? This cannot be undone.')) {
                onDelete();
              }
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-400/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              hasChanges
                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 hover:bg-yellow-300 active:scale-[0.98]'
                : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Code & Type Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Code de la question
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm font-mono text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
              placeholder="Q1"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Type de question
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
            >
              {Object.entries(questionTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">
            Texte de la question <span className="text-yellow-400">*</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
            placeholder="Saisissez votre question... Supporte l'intégration : {{Q1}}"
          />
          <p className="mt-1 text-xs text-zinc-600">
            Astuce : Utilisez {`{{CodeDeQuestion}}`} pour intégrer une réponse (piping), ex: &quot;Pourquoi avez-vous choisi{' '}
            {`{{Q1}}`} ?&quot;
          </p>
        </div>

        {/* Help Text */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Texte d'aide (Optionnel)</label>
          <input
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
            placeholder="Texte d'aide optionnel affiché sous la question"
          />
        </div>

        {/* Media Upload Zone for PRESENTATION */}
        {type === 'PRESENTATION' && (
          <div className="animate-fade-in glass-card rounded-xl p-4 border border-dashed border-zinc-700">
            <h3 className="mb-3 text-sm font-semibold text-zinc-400">Zone de Téléversement Média</h3>
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-colors duration-200",
                isDragActive 
                  ? "border-yellow-400 bg-yellow-400/5" 
                  : "border-transparent bg-zinc-900/50 hover:border-zinc-700"
              )}
            >
              <UploadIcon className={cn("h-8 w-8 mb-3 transition-colors", isDragActive ? "text-yellow-400" : "text-zinc-500")} />
              <p className="text-sm text-zinc-400 mb-4 text-center">
                Glissez-déposez un document ou une image ici.<br />
                Ou cliquez sur le bouton ci-dessous.
              </p>
              
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Téléversement...
                    </>
                  ) : (
                    <>Sélectionner un fichier</>
                  )}
                </button>
              </div>

              {defaultValue && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm flex items-center gap-2">
                  <span>Fichier attaché :</span>
                  <a href={defaultValue} target="_blank" rel="noreferrer" className="underline hover:text-emerald-300 truncate max-w-[200px]">
                    {defaultValue.split('/').pop()}
                  </a>
                  <button
                    onClick={() => setDefaultValue('')}
                    className="ml-2 text-rose-400 hover:text-rose-300"
                    title="Supprimer le fichier"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equation (for EQUATION type) */}
        {type === 'EQUATION' && (
          <div className="animate-fade-in">
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Equation Expression
            </label>
            <input
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
              placeholder="{{Q3_score}} + {{Q4_score}}"
            />
            <p className="mt-1 text-xs text-zinc-600">
              Exemple : <code>{`{{Q1_score}} + {{Q2_score}}`}</code>. Le résultat sera stocké en tant que réponse.
            </p>
          </div>
        )}

        {/* Choices (for choice-based types) */}
        {CHOICE_TYPES.includes(type) && (
          <div className="animate-fade-in">
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Options
            </label>
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div
                  key={choice.id || index}
                  className="group flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-2 transition-colors hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveChoice(index, 'up')}
                      disabled={index === 0}
                      className="text-zinc-600 hover:text-zinc-400 disabled:opacity-30"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveChoice(index, 'down')}
                      disabled={index === choices.length - 1}
                      className="text-zinc-600 hover:text-zinc-400 disabled:opacity-30"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>

                  <input
                    value={choice.code}
                    onChange={(e) => updateChoice(index, 'code', e.target.value)}
                    className="w-16 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-mono text-zinc-400 outline-none focus:border-yellow-400/50"
                    placeholder="A1"
                  />
                  <input
                    value={choice.label}
                    onChange={(e) => updateChoice(index, 'label', e.target.value)}
                    className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-zinc-200 outline-none focus:border-yellow-400/50"
                    placeholder="Libellé de l'option"
                  />
                  <input
                    value={choice.value}
                    onChange={(e) => updateChoice(index, 'value', e.target.value)}
                    className="w-28 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-400 outline-none focus:border-yellow-400/50"
                    placeholder="valeur_stockée"
                  />
                  <button
                    onClick={() => removeChoice(index)}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addChoice}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-yellow-400/30 hover:text-yellow-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un choix
            </button>
          </div>
        )}

        {/* Settings */}
        {type !== 'PRESENTATION' && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-400">Paramètres</h3>
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Obligatoire</p>
                <p className="text-xs text-zinc-500">Le participant doit répondre à cette question</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isRequired}
                onClick={() => setIsRequired(!isRequired)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  isRequired ? 'bg-yellow-400' : 'bg-zinc-700'
                )}
              >
                <span
                  className={cn(
                    'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    isRequired ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </label>
          </div>
        )}

        {/* Conditional Logic */}
        <div className="mt-4">
          <RelevanceEditor
            value={relevance}
            onChange={setRelevance}
            availableQuestions={availableQuestions}
          />
        </div>
      </div>
    </div>
  );
}
