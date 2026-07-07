import {
  FileText,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Clock,
  Eye,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const totalSurveys = await db.survey.count();
  const totalParticipants = await db.participant.count();
  const totalResponses = await db.surveyResponse.count();

  const completedParticipants = await db.participant.count({
    where: { status: 'COMPLETED' },
  });

  const { _sum } = await db.survey.aggregate({
    _sum: { views: true },
  });
  const totalViews = _sum.views || 0;

  let completionRate = 0;
  if (totalParticipants > 0) {
    completionRate = Math.round((completedParticipants / totalParticipants) * 100);
  } else if (totalViews > 0) {
    completionRate = Math.round((totalResponses / totalViews) * 100);
  }

  const recentSurveys = await db.survey.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: {
      _count: {
        select: { responses: true },
      },
    },
  });

  const stats = [
    {
      label: 'Total de sondages',
      value: totalSurveys.toString(),
      change: 'Tous les sondages',
      icon: FileText,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: totalParticipants > 0 ? 'Participants' : 'Vues totales',
      value: totalParticipants > 0 ? totalParticipants.toString() : totalViews.toString(),
      change: totalParticipants > 0 ? 'Toutes les invitations' : 'Toutes les consultations',
      icon: totalParticipants > 0 ? Users : Eye,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Réponses',
      value: totalResponses.toString(),
      change: 'Toutes les réponses',
      icon: CheckCircle2,
      color: 'text-sky-400',
      bg: 'bg-sky-400/10',
    },
    {
      label: 'Taux de complétion',
      value: (totalParticipants > 0 || totalViews > 0) ? `${Math.min(100, completionRate)}%` : '\u2014',
      change: totalParticipants > 0 ? 'Basé sur les invitations' : 'Basé sur les vues',
      icon: TrendingUp,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
    },
  ];

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tableau de bord
          </h1>
          <p className="mt-1 text-zinc-500">
            Aperçu de votre plateforme de sondage
          </p>
        </div>
        <Link
          href="/surveys/new"
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nouveau sondage
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card group rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/5"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-400" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="mt-0.5 text-sm text-zinc-500">{stat.label}</p>
            </div>
            <p className="mt-2 text-xs text-zinc-600">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Empty State / Recent Surveys */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Sondages récents</h2>
        {recentSurveys.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center rounded-xl py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
              <FileText className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-zinc-300">
              Aucun sondage pour le moment
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Créez votre premier sondage pour commencer
            </p>
            <Link
              href="/surveys/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-yellow-400/30 px-4 py-2 text-sm font-medium text-yellow-400 transition-all hover:bg-yellow-400/10"
            >
              <Plus className="h-4 w-4" />
              Créer un sondage
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentSurveys.map((survey) => (
              <Link
                key={survey.id}
                href={`/surveys/${survey.id}/edit`}
                className="glass-card group flex flex-col rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
                    <FileText className="h-5 w-5 text-zinc-400 group-hover:text-yellow-400 transition-colors" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                      survey.status
                    )}`}
                  >
                    {getStatusLabel(survey.status)}
                  </span>
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
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/surveys/new"
            className="glass-card group flex items-center gap-4 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/10">
              <Plus className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50">
                Nouveau sondage
              </p>
              <p className="text-xs text-zinc-500">Créer à partir de zéro</p>
            </div>
          </Link>
          <Link
            href="/surveys"
            className="glass-card group flex items-center gap-4 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10">
              <FileText className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50">
                Gérer les sondages
              </p>
              <p className="text-xs text-zinc-500">Voir toutes les réponses</p>
            </div>
          </Link>
          <Link
            href="/settings"
            className="glass-card group flex items-center gap-4 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10">
              <Settings className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50">
                Paramètres
              </p>
              <p className="text-xs text-zinc-500">Configurer l'apparence</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

