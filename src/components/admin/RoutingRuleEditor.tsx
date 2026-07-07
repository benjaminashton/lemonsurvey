'use client';

import { useState } from 'react';
import { RelevanceEditor } from './RelevanceEditor';
import type { RoutingRulePayload, RelevanceExpression, RoutingAction } from '@/types';
import { cn } from '@/lib/utils';
import { Mail, Webhook, CheckCircle2, Circle } from 'lucide-react';

interface AvailableQuestion {
  code: string;
  text: string;
  type: string;
  choices: { code: string; label: string; value: string }[];
}

interface RoutingRuleEditorProps {
  initialRule?: Partial<RoutingRulePayload>;
  availableQuestions: AvailableQuestion[];
  onSave: (rule: RoutingRulePayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function RoutingRuleEditor({
  initialRule,
  availableQuestions,
  onSave,
  onCancel,
  isSaving,
}: RoutingRuleEditorProps) {
  const [name, setName] = useState(initialRule?.name || '');
  const [actionType, setActionType] = useState<RoutingAction>(initialRule?.actionType || 'EMAIL');
  const [isActive, setIsActive] = useState(initialRule?.isActive ?? true);
  const [condition, setCondition] = useState<RelevanceExpression>(initialRule?.condition || null);
  
  const [recipientEmail, setRecipientEmail] = useState(initialRule?.recipientEmail || '');
  const [emailSubject, setEmailSubject] = useState(initialRule?.emailSubject || '');
  const [emailBody, setEmailBody] = useState(initialRule?.emailBody || '');
  
  const [webhookUrl, setWebhookUrl] = useState(initialRule?.webhookUrl || '');

  const handleSave = () => {
    if (!name.trim()) return;
    
    const payload: RoutingRulePayload = {
      name,
      actionType,
      isActive,
      condition,
      recipientEmail: actionType === 'EMAIL' ? recipientEmail : undefined,
      emailSubject: actionType === 'EMAIL' ? emailSubject : undefined,
      emailBody: actionType === 'EMAIL' ? emailBody : undefined,
      webhookUrl: actionType === 'WEBHOOK' ? webhookUrl : undefined,
    };
    
    onSave(payload);
  };

  return (
    <div className="glass-card flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Name & Active Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Nom de la règle
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-400/50"
              placeholder="Ex: Notification Admin"
            />
          </div>
          <div className="flex items-center gap-2 pt-8">
            <span className="text-sm text-zinc-400">Actif</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className="text-violet-400 transition-colors hover:text-violet-300"
            >
              {isActive ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6 text-zinc-600" />
              )}
            </button>
          </div>
        </div>

        {/* Action Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Type d'action
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setActionType('EMAIL')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 transition-colors',
                actionType === 'EMAIL'
                  ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-400'
              )}
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">EMAIL</span>
            </button>
            <button
              onClick={() => setActionType('WEBHOOK')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 transition-colors',
                actionType === 'WEBHOOK'
                  ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-400'
              )}
            >
              <Webhook className="h-4 w-4" />
              <span className="text-sm font-medium">WEBHOOK</span>
            </button>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Quand cette règle doit-elle se déclencher ?
          </label>
          <p className="mb-3 text-xs text-zinc-500">
            Définissez les conditions de déclenchement en fonction des réponses au formulaire.
          </p>
          <RelevanceEditor
            value={condition}
            onChange={setCondition}
            availableQuestions={availableQuestions}
          />
        </div>

        {/* Action specific fields */}
        <div className="space-y-4 rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-medium text-zinc-300">
            Configuration de l'action
          </h3>
          
          {actionType === 'EMAIL' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Destinataire
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-400/50"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Sujet
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-400/50"
                  placeholder="Nouvelle réponse au formulaire"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Corps du message
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-400/50"
                  placeholder="Bonjour, une nouvelle réponse a été reçue..."
                />
                <p className="mt-1.5 text-[10px] text-zinc-500">
                  Astuce : Vous pouvez utiliser les codes des questions pour intégrer les réponses (ex: {'{{Q1}}'}). Ou utiliser la balise spéciale {'{{RESPONSE_LINK}}'} pour un lien direct.
                </p>
              </div>
            </div>
          )}

          {actionType === 'WEBHOOK' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  URL du Webhook
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-400/50"
                  placeholder="https://api.example.com/webhook"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-800 p-4">
        <button
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
