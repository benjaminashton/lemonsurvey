'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RelevanceEditor } from './RelevanceEditor';
import type { RelevanceExpression } from '@/types';
import type { Group } from './SurveyBuilder';

interface GroupSettingsModalProps {
  group: Group;
  availableQuestions: { code: string; text: string; type: string; choices: { code: string; label: string; value: string }[] }[];
  onClose: () => void;
  onSave: (groupId: string, data: { title?: string; description?: string; relevance?: RelevanceExpression }) => Promise<void>;
}

export function GroupSettingsModal({
  group,
  availableQuestions,
  onClose,
  onSave,
}: GroupSettingsModalProps) {
  const [title, setTitle] = useState(group.title);
  const [description, setDescription] = useState(group.description ?? '');
  const [relevance, setRelevance] = useState<RelevanceExpression>(
    (group.relevance as RelevanceExpression) ?? null
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(group.id, {
      title,
      description: description || undefined,
      relevance,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
      <div className="animate-fade-in flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-200">Paramètres de la page</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Titre de la page
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-yellow-400/50"
                placeholder="Ex: Informations personnelles"
              />
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Description (Optionnelle)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-yellow-400/50"
                placeholder="Une brève description affichée sous le titre de la page"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-400">
                Visibilité de la page (Logique conditionnelle)
              </label>
              <p className="mb-3 text-xs text-zinc-500">
                Définissez les conditions pour que cette page entière soit affichée aux participants.
              </p>
              <RelevanceEditor
                value={relevance}
                onChange={setRelevance}
                availableQuestions={availableQuestions}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-50"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
