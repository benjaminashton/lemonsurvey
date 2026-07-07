'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, FileText, Plus, Clock, Users, Trash2 } from 'lucide-react';
import { Survey, SurveyStatus } from '@prisma/client';

type SurveyWithCounts = Survey & {
  _count: {
    responses: number;
  };
};

export function SurveyListClient({ surveys }: { surveys: SurveyWithCounts[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm('Voulez-vous vraiment supprimer ce sondage ? Cette action est irréversible.')) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Erreur lors de la suppression du sondage.');
      }
    } catch (error) {
      alert('Erreur réseau.');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredSurveys = surveys.filter((survey) =>
    survey.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: SurveyStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'DRAFT':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'CLOSED':
        return 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20';
      case 'ARCHIVED':
        return 'bg-rose-400/10 text-rose-400 border-rose-400/20';
      default:
        return 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20';
    }
  };

  const getStatusLabel = (status: SurveyStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'DRAFT':
        return 'Brouillon';
      case 'CLOSED':
        return 'Fermé';
      case 'ARCHIVED':
        return 'Archivé';
      default:
        return status;
    }
  };

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher des sondages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
          />
        </div>
      </div>

      {filteredSurveys.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <FileText className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-zinc-300">
            Aucun sondage trouvé
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-zinc-500">
            {search
              ? 'Aucun sondage ne correspond à votre recherche.'
              : 'Créez votre premier sondage pour commencer à recueillir des réponses.'}
          </p>
          {!search && (
            <Link
              href="/surveys/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-yellow-400/30 px-4 py-2 text-sm font-medium text-yellow-400 transition-all hover:bg-yellow-400/10"
            >
              <Plus className="h-4 w-4" />
              Créer un sondage
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSurveys.map((survey) => (
            <Link
              key={survey.id}
              href={`/surveys/${survey.id}/edit`}
              className="glass-card group flex flex-col rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
                  <FileText className="h-5 w-5 text-zinc-400 group-hover:text-yellow-400 transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                      survey.status
                    )}`}
                  >
                    {getStatusLabel(survey.status)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, survey.id)}
                    disabled={isDeleting === survey.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-zinc-50 transition-colors line-clamp-1">
                  {survey.title}
                </h3>
                {survey.description && (
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                    {survey.description}
                  </p>
                )}
              </div>
              <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{survey._count.responses}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {new Date(survey.updatedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
