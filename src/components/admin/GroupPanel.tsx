'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  CircleDot,
  CheckSquare,
  ChevronDownSquare,
  Type,
  AlignLeft,
  Star,
  Upload,
  Calculator,
  Pencil,
  Settings,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Group } from './SurveyBuilder';
import { GroupSettingsModal } from './GroupSettingsModal';

const questionTypeIcons: Record<string, typeof CircleDot> = {
  SINGLE_CHOICE: CircleDot,
  MULTIPLE_CHOICE: CheckSquare,
  DROPDOWN: ChevronDownSquare,
  TEXT_SHORT: Type,
  TEXT_LONG: AlignLeft,
  RATING: Star,
  FILE_UPLOAD: Upload,
  EQUATION: Calculator,
};

const questionTypeLabels: Record<string, string> = {
  SINGLE_CHOICE: 'Choix unique',
  MULTIPLE_CHOICE: 'Choix multiple',
  DROPDOWN: 'Menu déroulant',
  TEXT_SHORT: 'Texte court',
  TEXT_LONG: 'Texte long',
  RATING: 'Évaluation',
  FILE_UPLOAD: 'Téléversement',
  EQUATION: 'Équation',
  PRESENTATION: 'Présentation',
};

interface GroupPanelProps {
  groups: Group[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
  onAddGroup: () => void;
  onDeleteGroup: (id: string) => void;
  onUpdateGroup: (id: string, data: { title?: string; description?: string; relevance?: any }) => Promise<void> | void;
  onAddQuestion: (groupId: string, type: string) => void;
  onDeleteQuestion: (id: string) => void;
  onMoveQuestion?: (sourceId: string, targetId: string, isGroupDrop?: boolean) => void;
}

export function GroupPanel({
  groups,
  selectedQuestionId,
  onSelectQuestion,
  onAddGroup,
  onDeleteGroup,
  onUpdateGroup,
  onAddQuestion,
  onDeleteQuestion,
  onMoveQuestion,
}: GroupPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.id))
  );
  const [addingQuestionTo, setAddingQuestionTo] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState('');
  const [settingsGroup, setSettingsGroup] = useState<Group | null>(null);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditingGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupTitle(group.title);
  };

  const saveGroupTitle = (groupId: string) => {
    if (editingGroupTitle.trim()) {
      onUpdateGroup(groupId, { title: editingGroupTitle.trim() });
    }
    setEditingGroupId(null);
  };

  return (
    <div className="flex w-80 flex-col border-r border-zinc-800/80 bg-zinc-950">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-zinc-800/60 px-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Structure
        </span>
        <button
          onClick={onAddGroup}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-yellow-400 transition-colors hover:bg-yellow-400/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter une page
        </button>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto py-2">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-2 h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">Aucune page pour le moment</p>
            <button
              onClick={onAddGroup}
              className="mt-3 text-xs font-medium text-yellow-400 hover:underline"
            >
              Ajoutez votre première page
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <div 
              key={group.id} 
              className="mb-1"
              onDragOver={(e) => {
                e.preventDefault();
                if (group.questions.length === 0) setDragOverId(group.id);
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverId(null);
                if (draggedQuestionId && group.questions.length === 0 && onMoveQuestion) {
                  onMoveQuestion(draggedQuestionId, group.id, true);
                }
              }}
            >
              {/* Group Header */}
              <div className="group flex items-center gap-1 px-2">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                >
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>

                {editingGroupId === group.id ? (
                  <input
                    value={editingGroupTitle}
                    onChange={(e) => setEditingGroupTitle(e.target.value)}
                    onBlur={() => saveGroupTitle(group.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveGroupTitle(group.id);
                      if (e.key === 'Escape') setEditingGroupId(null);
                    }}
                    autoFocus
                    className="flex-1 rounded bg-zinc-800 px-2 py-0.5 text-sm text-zinc-200 outline-none ring-1 ring-yellow-400/50"
                  />
                ) : (
                  <span
                    className="flex-1 cursor-default truncate text-sm font-medium text-zinc-300"
                    onDoubleClick={() => startEditingGroup(group)}
                  >
                    {group.title}
                  </span>
                )}

                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setSettingsGroup(group)}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
                    title="Paramètres"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => startEditingGroup(group)}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
                    title="Renommer"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer cette page et toutes ses questions ?')) {
                        onDeleteGroup(group.id);
                      }
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
                    title="Supprimer la page"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Questions */}
              {expandedGroups.has(group.id) && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-zinc-800/60 pl-2">
                  {group.questions.map((question) => {
                    const Icon = questionTypeIcons[question.type] ?? FileText;
                    const isSelected = selectedQuestionId === question.id;
                    return (
                      <div
                        key={question.id}
                        draggable={!!onMoveQuestion}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDraggedQuestionId(question.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverId(question.id);
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverId(null);
                          if (draggedQuestionId && draggedQuestionId !== question.id && onMoveQuestion) {
                            onMoveQuestion(draggedQuestionId, question.id);
                          }
                          setDraggedQuestionId(null);
                        }}
                        onDragEnd={() => setDraggedQuestionId(null)}
                        onClick={() => onSelectQuestion(question.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onSelectQuestion(question.id)}
                        className={cn(
                          'group/q flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left transition-all',
                          isSelected
                            ? 'bg-yellow-400/10 text-yellow-400'
                            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300',
                          dragOverId === question.id ? 'border-t-2 border-t-yellow-400 bg-zinc-800' : 'border-t-2 border-t-transparent',
                          draggedQuestionId === question.id ? 'opacity-50' : ''
                        )}
                      >
                        <div className="flex cursor-grab items-center opacity-0 transition-opacity group-hover/q:opacity-100 text-zinc-600 hover:text-zinc-400 active:cursor-grabbing">
                          <GripVertical className="h-3.5 w-3.5" />
                        </div>
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            isSelected ? 'text-yellow-400' : 'text-zinc-600'
                          )}
                        />
                        <span className="flex-1 truncate text-xs">
                          <span
                            className={cn(
                              'mr-1 font-mono',
                              isSelected ? 'text-yellow-400/70' : 'text-zinc-600'
                            )}
                          >
                            {question.code}
                          </span>
                          {question.text.replace(/<[^>]*>/g, '').substring(0, 40)}
                        </span>
                        {question.isRequired && (
                          <span className="text-[10px] text-yellow-400/50">*</span>
                        )}
                        <div className="flex opacity-0 transition-opacity group-hover/q:opacity-100 items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Supprimer cette question ?')) {
                                onDeleteQuestion(question.id);
                              }
                            }}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Question Button / Type Picker */}
                  {addingQuestionTo === group.id ? (
                    <div className="animate-fade-in rounded-lg border border-zinc-800 bg-zinc-900 p-2">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Choose type
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(questionTypeLabels).map(([type, label]) => {
                          const TypeIcon = questionTypeIcons[type] ?? FileText;
                          return (
                            <button
                              key={type}
                              onClick={() => {
                                onAddQuestion(group.id, type);
                                setAddingQuestionTo(null);
                              }}
                              className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                            >
                              <TypeIcon className="h-3 w-3 text-zinc-500" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setAddingQuestionTo(null)}
                        className="mt-2 w-full text-center text-[10px] text-zinc-600 hover:text-zinc-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingQuestionTo(group.id)}
                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-800/40 hover:text-zinc-400"
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter une question
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Settings Modal */}
      {settingsGroup && (
        <GroupSettingsModal
          group={settingsGroup}
          availableQuestions={groups.flatMap((g) => g.questions).map((q) => ({
            code: q.code,
            text: q.text,
            type: q.type,
            choices: q.choices,
          }))}
          onClose={() => setSettingsGroup(null)}
          onSave={async (groupId, data) => {
            await onUpdateGroup(groupId, data);
          }}
        />
      )}
    </div>
  );
}
