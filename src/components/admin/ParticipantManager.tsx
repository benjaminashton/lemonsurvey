'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Search,
  Mail,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  token: string;
  status: 'PENDING' | 'INVITED' | 'STARTED' | 'COMPLETED' | 'EXPIRED';
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-zinc-800 text-zinc-300',
  INVITED: 'bg-blue-500/15 text-blue-400',
  STARTED: 'bg-yellow-400/15 text-yellow-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400',
  EXPIRED: 'bg-red-500/15 text-red-400',
};

export function ParticipantManager({
  surveyId,
  surveySlug,
  requireToken,
}: {
  surveyId: string;
  surveySlug: string;
  requireToken: boolean;
}) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Add Participant Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/participants`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          firstName: newFirstName || undefined,
          lastName: newLastName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add participant');
      }

      await fetchParticipants();
      setIsAdding(false);
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce participant ?')) return;
    try {
      const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
      if (res.ok) fetchParticipants();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerateToken = async (id: string) => {
    if (!confirm('Générer un nouveau jeton ? L\'ancien jeton sera invalidé.')) return;
    try {
      const res = await fetch(`/api/participants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REGENERATE_TOKEN' }),
      });
      if (res.ok) fetchParticipants();
    } catch (e) {
      console.error(e);
    }
  };

  const copyLink = (token: string) => {
    const origin = window.location.origin;
    const link = `${origin}/s/${surveySlug}?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filtered = participants.filter(
    (p) =>
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.token.includes(searchTerm)
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header & Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-200">Participants</h2>
          <p className="text-sm text-zinc-500">
            {requireToken
              ? 'Ce sondage nécessite un jeton valide pour participer.'
              : 'Les jetons sont facultatifs pour ce sondage, mais peuvent être utilisés pour suivre des personnes spécifiques.'}
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          Ajouter un participant
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="mb-6 animate-fade-in glass-card rounded-xl border border-yellow-400/20 p-5">
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">E-mail *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-yellow-400/50"
                  placeholder="participant@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Prénom</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-yellow-400/50"
                  placeholder="Optionnel"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nom de famille</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-yellow-400/50"
                  placeholder="Optionnel"
                />
              </div>
            </div>
            {addError && <p className="text-xs text-red-400">{addError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par e-mail, nom ou jeton..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2 pl-10 pr-4 text-sm text-zinc-200 outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/30">
        <div className="h-full overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-zinc-950/90 text-xs text-zinc-500 backdrop-blur">
              <tr>
                <th className="px-6 py-3 font-medium">Participant</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Jeton</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-yellow-400" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
                    <p className="text-zinc-400">Aucun participant trouvé</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">{p.email}</p>
                          {(p.firstName || p.lastName) && (
                            <p className="text-xs text-zinc-500">
                              {[p.firstName, p.lastName].filter(Boolean).join(' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                          statusColors[p.status]
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                          {p.token}
                        </code>
                        <button
                          onClick={() => copyLink(p.token)}
                          className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                          title="Copier le lien direct du sondage"
                        >
                          {copiedToken === p.token ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 lg:opacity-100">
                        <button
                          onClick={() => handleRegenerateToken(p.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                          title="Régénérer le jeton"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                          title="Supprimer le participant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
