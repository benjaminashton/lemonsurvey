'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewSurveyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    welcomeText: '',
    endText: '',
    allowBack: true,
    requireToken: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Failed to create survey');

      const data = await res.json();
      router.push(`/surveys/${data.data.id}/edit`);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <Link
          href="/surveys"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sondages
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Créer un sondage</h1>
        <p className="mt-1 text-zinc-500">
          Configurez les bases, puis ajoutez des questions dans le constructeur.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Titre du sondage <span className="text-yellow-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="ex: Sondage de satisfaction client 2026"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description interne pour votre référence..."
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>

        {/* Welcome Text */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Message de bienvenue
          </label>
          <textarea
            value={form.welcomeText}
            onChange={(e) => setForm({ ...form, welcomeText: e.target.value })}
            placeholder="Affiché aux participants avant qu'ils ne commencent..."
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>

        {/* End Text */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Message de fin
          </label>
          <textarea
            value={form.endText}
            onChange={(e) => setForm({ ...form, endText: e.target.value })}
            placeholder="Message de remerciement affiché après la soumission. Supporte l'interpolation: {{Q1}}"
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>

        {/* Toggle Settings */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">Paramètres</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Autoriser la navigation en arrière</p>
                <p className="text-xs text-zinc-500">Permettre aux participants de revenir aux pages précédentes</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.allowBack}
                onClick={() => setForm({ ...form, allowBack: !form.allowBack })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  form.allowBack ? 'bg-yellow-400' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.allowBack ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Jeton obligatoire</p>
                <p className="text-xs text-zinc-500">Seuls les participants disposant d'un jeton valide peuvent accéder</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.requireToken}
                onClick={() => setForm({ ...form, requireToken: !form.requireToken })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  form.requireToken ? 'bg-yellow-400' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.requireToken ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading || !form.title}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isLoading ? 'Création...' : 'Créer le sondage'}
          </button>
          <Link
            href="/surveys"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
