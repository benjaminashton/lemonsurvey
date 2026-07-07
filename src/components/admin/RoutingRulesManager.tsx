'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Play, Circle, CheckCircle2, Loader2, GitBranch } from 'lucide-react';
import { RoutingRuleEditor } from './RoutingRuleEditor';
import type { RoutingRule, RoutingRulePayload } from '@/types';
import { cn } from '@/lib/utils';

interface AvailableQuestion {
  code: string;
  text: string;
  type: string;
  choices: { code: string; label: string; value: string }[];
}

interface RoutingRulesManagerProps {
  surveyId: string;
  availableQuestions: AvailableQuestion[];
}

export function RoutingRulesManager({ surveyId, availableQuestions }: RoutingRulesManagerProps) {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingRule, setEditingRule] = useState<Partial<RoutingRulePayload> | RoutingRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [surveyId]);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/surveys/${surveyId}/routing-rules`);
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      } else {
        setError(data.error || 'Erreur lors du chargement des règles');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return;
    
    try {
      const res = await fetch(`/api/surveys/${surveyId}/routing-rules/${ruleId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setRules(rules.filter((r) => r.id !== ruleId));
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      alert('Erreur de connexion');
    }
  };

  const handleToggleActive = async (rule: RoutingRule) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/routing-rules/${rule.id}`, {
        method: 'PATCH', // Assuming PATCH is for partial updates, or PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setRules(rules.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)));
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      alert('Erreur de connexion');
    }
  };

  const handleSaveRule = async (payload: RoutingRulePayload) => {
    setIsSaving(true);
    try {
      const isEditing = editingRule && 'id' in editingRule;
      const url = isEditing 
        ? `/api/surveys/${surveyId}/routing-rules/${(editingRule as RoutingRule).id}`
        : `/api/surveys/${surveyId}/routing-rules`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        if (isEditing) {
          setRules(rules.map((r) => (r.id === data.data.id ? data.data : r)));
        } else {
          setRules([...rules, data.data]);
        }
        setEditingRule(null);
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (editingRule !== null) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => setEditingRule(null)}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            ← Retour aux règles
          </button>
        </div>
        <RoutingRuleEditor
          initialRule={editingRule}
          availableQuestions={availableQuestions}
          onSave={handleSaveRule}
          onCancel={() => setEditingRule(null)}
          isSaving={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-200">Règles de routage</h2>
          <p className="text-sm text-zinc-500">
            Configurez des actions automatiques basées sur les réponses des participants.
          </p>
        </div>
        <button
          onClick={() => setEditingRule({})}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
        >
          <Plus className="h-4 w-4" />
          Nouvelle règle
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl border border-zinc-800 border-dashed py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 shadow-inner">
            <GitBranch className="h-6 w-6 text-zinc-500" />
          </div>
          <h3 className="text-base font-medium text-zinc-300">Aucune règle configurée</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">
            Créez des règles pour envoyer des emails ou déclencher des webhooks selon les réponses.
          </p>
          <button
            onClick={() => setEditingRule({})}
            className="mt-6 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            + Créer ma première règle
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "glass-card flex items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:border-zinc-700",
                rule.isActive ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-800/50 bg-zinc-900/20 opacity-75"
              )}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggleActive(rule)}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 shadow-inner transition-colors"
                  title={rule.isActive ? "Désactiver" : "Activer"}
                >
                  {rule.isActive ? (
                    <CheckCircle2 className="h-5 w-5 text-violet-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-zinc-600 group-hover:text-zinc-500" />
                  )}
                </button>
                <div>
                  <h3 className="font-medium text-zinc-200">{rule.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                        rule.actionType === 'EMAIL' 
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      )}
                    >
                      {rule.actionType}
                    </span>
                    {!rule.isActive && (
                      <span className="text-[10px] text-zinc-500">(Inactif)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingRule(rule)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <div className="h-4 w-px bg-zinc-800" />
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
