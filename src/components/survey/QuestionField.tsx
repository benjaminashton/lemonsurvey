'use client';

import { cn } from '@/lib/utils';
import { interpolate } from '@/lib/piping/interpolate';
import type { AnswerMap } from '@/types';
import { AlertCircle, Star, Download } from 'lucide-react';

interface Choice {
  id: string;
  code: string;
  label: string;
  value: string;
}

interface Question {
  id: string;
  code: string;
  text: string;
  helpText: string | null;
  type: string;
  isRequired: boolean;
  defaultValue?: string | null;
  choices: Choice[];
}

interface QuestionFieldProps {
  question: Question;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  answerMap: AnswerMap;
  hasError: boolean;
}

export function QuestionField({
  question,
  value,
  onChange,
  answerMap,
  hasError,
}: QuestionFieldProps) {
  const pipedText = interpolate(question.text, answerMap);
  const pipedHelp = question.helpText
    ? interpolate(question.helpText, answerMap)
    : null;

  return (
    <div
      className={cn(
        'rounded-xl border p-5 transition-colors',
        hasError
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-zinc-800/60 bg-zinc-900/30'
      )}
    >
      {/* Question Text */}
      <div className="flex items-start">
        <div className="text-sm font-medium text-zinc-200 [&>p]:inline" dangerouslySetInnerHTML={{ __html: pipedText }} />
        {question.isRequired && question.type !== 'PRESENTATION' && (
          <span className="ml-1 text-yellow-400 leading-tight mt-0.5">*</span>
        )}
      </div>
      {pipedHelp && (
        <div className="mt-2 text-sm text-zinc-400" dangerouslySetInnerHTML={{ __html: pipedHelp }} />
      )}

      {/* Input */}
      <div className="mt-3">
        {question.type === 'SINGLE_CHOICE' && (
          <SingleChoiceInput
            choices={question.choices}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
          />
        )}
        {question.type === 'MULTIPLE_CHOICE' && (
          <MultipleChoiceInput
            choices={question.choices}
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
          />
        )}
        {question.type === 'DROPDOWN' && (
          <DropdownInput
            choices={question.choices}
            value={typeof value === 'string' ? value : ''}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === 'TEXT_SHORT' && (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
            placeholder="Tapez votre réponse ici..."
          />
        )}
        {question.type === 'TEXT_LONG' && (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
            placeholder="Tapez votre réponse ici..."
          />
        )}
        {question.type === 'RATING' && (
          <RatingInput
            value={typeof value === 'string' ? parseInt(value, 10) || 0 : 0}
            onChange={(v) => onChange(String(v))}
          />
        )}
        {question.type === 'PRESENTATION' && (
          <div className="mt-2">
            {question.defaultValue && (
              <a
                href={question.defaultValue}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/30 active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                Télécharger le fichier
              </a>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {hasError && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          Ce champ est obligatoire
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function SingleChoiceInput({
  choices,
  value,
  onChange,
}: {
  choices: Choice[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {choices.map((c) => (
        <label
          key={c.id}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all',
            value === c.value
              ? 'border-yellow-400/40 bg-yellow-400/5 text-zinc-200'
              : 'border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
          )}
        >
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
              value === c.value
                ? 'border-yellow-400'
                : 'border-zinc-600'
            )}
          >
            {value === c.value && (
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            )}
          </div>
          <span className="text-sm">{c.label}</span>
          <input
            type="radio"
            name="single-choice"
            className="hidden"
            checked={value === c.value}
            onChange={() => onChange(c.value)}
          />
        </label>
      ))}
    </div>
  );
}

function MultipleChoiceInput({
  choices,
  value,
  onChange,
}: {
  choices: Choice[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (choiceValue: string) => {
    if (value.includes(choiceValue)) {
      onChange(value.filter((v) => v !== choiceValue));
    } else {
      onChange([...value, choiceValue]);
    }
  };

  return (
    <div className="space-y-2">
      {choices.map((c) => {
        const isChecked = value.includes(c.value);
        return (
          <label
            key={c.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all',
              isChecked
                ? 'border-yellow-400/40 bg-yellow-400/5 text-zinc-200'
                : 'border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                isChecked
                  ? 'border-yellow-400 bg-yellow-400'
                  : 'border-zinc-600'
              )}
            >
              {isChecked && (
                <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm">{c.label}</span>
            <input
              type="checkbox"
              className="hidden"
              checked={isChecked}
              onChange={() => toggle(c.value)}
            />
          </label>
        );
      })}
    </div>
  );
}

function DropdownInput({
  choices,
  value,
  onChange,
}: {
  choices: Choice[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
    >
      <option value="">Sélectionnez une option...</option>
      {choices.map((c) => (
        <option key={c.id} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border transition-all',
            value >= rating
              ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400'
              : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
          )}
        >
          <Star
            className="h-5 w-5"
            fill={value >= rating ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );
}
