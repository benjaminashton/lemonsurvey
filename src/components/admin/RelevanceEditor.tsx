'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  GitBranch,
  ChevronDown,
  X,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Condition,
  ConditionGroup,
  ComparisonOp,
  RelevanceExpression,
} from '@/types';

const OP_LABELS: Record<ComparisonOp, string> = {
  eq: 'égal à',
  neq: 'différent de',
  gt: 'supérieur à',
  lt: 'inférieur à',
  gte: 'supérieur ou égal',
  lte: 'inférieur ou égal',
  contains: 'contient',
  in: 'est l\'un de',
  empty: 'est vide',
  notEmpty: 'n\'est pas vide',
};

const NO_VALUE_OPS: ComparisonOp[] = ['empty', 'notEmpty'];

interface AvailableQuestion {
  code: string;
  text: string;
  type: string;
  choices: { code: string; label: string; value: string }[];
}

interface RelevanceEditorProps {
  value: RelevanceExpression;
  onChange: (value: RelevanceExpression) => void;
  availableQuestions: AvailableQuestion[];
}

export function RelevanceEditor({
  value,
  onChange,
  availableQuestions,
}: RelevanceEditorProps) {
  const [isExpanded, setIsExpanded] = useState(value !== null);

  const hasConditions = value !== null && value.conditions.length > 0;

  const enableRelevance = () => {
    setIsExpanded(true);
    if (!value) {
      onChange({
        operator: 'AND',
        conditions: [
          {
            questionCode: availableQuestions[0]?.code ?? '',
            op: 'eq',
            value: '',
          },
        ],
      });
    }
  };

  const clearRelevance = () => {
    onChange(null);
    setIsExpanded(false);
  };

  // Summary text
  const getSummary = (): string => {
    if (!value || value.conditions.length === 0) return 'Toujours visible';
    const count = countConditions(value);
    return `${count} condition${count !== 1 ? 's' : ''} (${value.operator})`;
  };

  return (
    <div className="glass-card rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-zinc-400">
            Logique conditionnelle
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{getSummary()}</span>
          {hasConditions ? (
            <button
              onClick={clearRelevance}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Effacer
            </button>
          ) : (
            <button
              onClick={enableRelevance}
              disabled={availableQuestions.length === 0}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Ajouter une logique
            </button>
          )}
        </div>
      </div>

      {availableQuestions.length === 0 && !hasConditions && (
        <p className="mt-2 text-xs text-zinc-600">
          Ajoutez plus de questions pour activer la logique conditionnelle
        </p>
      )}

      {/* Condition Builder */}
      {isExpanded && value && (
        <div className="mt-4 animate-fade-in">
          <ConditionGroupEditor
            group={value}
            onChange={onChange}
            onRemove={clearRelevance}
            availableQuestions={availableQuestions}
            isRoot
          />
        </div>
      )}
    </div>
  );
}

// --- Condition Group ---

function ConditionGroupEditor({
  group,
  onChange,
  onRemove,
  availableQuestions,
  isRoot = false,
}: {
  group: ConditionGroup;
  onChange: (group: ConditionGroup) => void;
  onRemove: () => void;
  availableQuestions: AvailableQuestion[];
  isRoot?: boolean;
}) {
  const toggleOperator = () => {
    onChange({ ...group, operator: group.operator === 'AND' ? 'OR' : 'AND' });
  };

  const addCondition = () => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        {
          questionCode: availableQuestions[0]?.code ?? '',
          op: 'eq' as ComparisonOp,
          value: '',
        },
      ],
    });
  };

  const addNestedGroup = () => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        {
          operator: group.operator === 'AND' ? 'OR' : 'AND',
          conditions: [
            {
              questionCode: availableQuestions[0]?.code ?? '',
              op: 'eq' as ComparisonOp,
              value: '',
            },
          ],
        },
      ],
    });
  };

  const updateCondition = (index: number, updated: Condition | ConditionGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updated;
    onChange({ ...group, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    if (newConditions.length === 0 && isRoot) {
      onRemove();
    } else {
      onChange({ ...group, conditions: newConditions });
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        isRoot
          ? 'border-zinc-800/60 bg-zinc-900/20'
          : 'border-violet-500/20 bg-violet-500/5'
      )}
    >
      {/* Operator Toggle */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleOperator}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-bold transition-all',
              group.operator === 'AND'
                ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
            )}
          >
            {group.operator}
          </button>
          <span className="text-[10px] text-zinc-600">
            {group.operator === 'AND'
              ? 'Toutes les conditions doivent être remplies'
              : 'Au moins une condition doit être remplie'}
          </span>
        </div>
        {!isRoot && (
          <button
            onClick={onRemove}
            className="flex h-5 w-5 items-center justify-center rounded text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        {group.conditions.map((condition, index) => (
          <div key={index}>
            {/* Divider with operator */}
            {index > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 border-t border-zinc-800/40" />
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    group.operator === 'AND' ? 'text-blue-500/60' : 'text-amber-500/60'
                  )}
                >
                  {group.operator}
                </span>
                <div className="flex-1 border-t border-zinc-800/40" />
              </div>
            )}

            {'operator' in condition ? (
              <ConditionGroupEditor
                group={condition as ConditionGroup}
                onChange={(updated) => updateCondition(index, updated)}
                onRemove={() => removeCondition(index)}
                availableQuestions={availableQuestions}
              />
            ) : (
              <ConditionRow
                condition={condition as Condition}
                onChange={(updated) => updateCondition(index, updated)}
                onRemove={() => removeCondition(index)}
                availableQuestions={availableQuestions}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={addCondition}
          disabled={availableQuestions.length === 0}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300 disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          Condition
        </button>
        <button
          onClick={addNestedGroup}
          disabled={availableQuestions.length === 0}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300 disabled:opacity-40"
        >
          <Layers className="h-3 w-3" />
          Groupe
        </button>
      </div>
    </div>
  );
}

// --- Single Condition Row ---

function ConditionRow({
  condition,
  onChange,
  onRemove,
  availableQuestions,
}: {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
  availableQuestions: AvailableQuestion[];
}) {
  const selectedQuestion = availableQuestions.find(
    (q) => q.code === condition.questionCode
  );
  const hasChoices = selectedQuestion && selectedQuestion.choices.length > 0;
  const isNoValueOp = NO_VALUE_OPS.includes(condition.op);

  return (
    <div className="group flex items-start gap-2">
      {/* Question selector */}
      <select
        value={condition.questionCode}
        onChange={(e) =>
          onChange({ ...condition, questionCode: e.target.value, value: '' })
        }
        className="w-28 shrink-0 rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-violet-400/50"
      >
        <option value="">Question...</option>
        {availableQuestions.map((q) => (
          <option key={q.code} value={q.code}>
            {q.code} — {q.text.substring(0, 25)}
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.op}
        onChange={(e) =>
          onChange({ ...condition, op: e.target.value as ComparisonOp })
        }
        className="w-32 shrink-0 rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-violet-400/50"
      >
        {Object.entries(OP_LABELS).map(([op, label]) => (
          <option key={op} value={op}>
            {label}
          </option>
        ))}
      </select>

      {/* Value */}
      {!isNoValueOp && (
        <>
          {hasChoices && (condition.op === 'eq' || condition.op === 'neq') ? (
            <select
              value={String(condition.value)}
              onChange={(e) =>
                onChange({ ...condition, value: e.target.value })
              }
              className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-violet-400/50"
            >
              <option value="">Sélectionnez une valeur...</option>
              {selectedQuestion.choices.map((c) => (
                <option key={c.code} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          ) : hasChoices && condition.op === 'in' ? (
            <MultiSelect
              choices={selectedQuestion.choices}
              value={
                Array.isArray(condition.value)
                  ? condition.value
                  : condition.value
                    ? [String(condition.value)]
                    : []
              }
              onChange={(vals) => onChange({ ...condition, value: vals })}
            />
          ) : (
            <input
              type="text"
              value={String(condition.value)}
              onChange={(e) =>
                onChange({ ...condition, value: e.target.value })
              }
              placeholder="Valeur..."
              className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-violet-400/50"
            />
          )}
        </>
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// --- Multi-Select for "in" operator ---

function MultiSelect({
  choices,
  value,
  onChange,
}: {
  choices: { code: string; label: string; value: string }[];
  value: string[];
  onChange: (values: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (choiceValue: string) => {
    if (value.includes(choiceValue)) {
      onChange(value.filter((v) => v !== choiceValue));
    } else {
      onChange([...value, choiceValue]);
    }
  };

  return (
    <div className="relative flex-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-violet-400/50"
      >
        <span className="truncate">
          {value.length === 0
            ? 'Sélectionnez des valeurs...'
            : `${value.length} sélectionné(s)`}
        </span>
        <ChevronDown className="h-3 w-3 text-zinc-500" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
          {choices.map((c) => (
            <label
              key={c.code}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              <input
                type="checkbox"
                checked={value.includes(c.value)}
                onChange={() => toggle(c.value)}
                className="rounded border-zinc-600"
              />
              {c.label}
            </label>
          ))}
          <button
            onClick={() => setIsOpen(false)}
            className="mt-1 w-full rounded px-2 py-1 text-center text-[10px] text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400"
          >
            Terminé
          </button>
        </div>
      )}
    </div>
  );
}

// --- Utility ---

function countConditions(group: ConditionGroup): number {
  let count = 0;
  for (const c of group.conditions) {
    if ('operator' in c) {
      count += countConditions(c as ConditionGroup);
    } else {
      count += 1;
    }
  }
  return count;
}
