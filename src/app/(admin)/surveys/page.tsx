import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { SurveyListClient } from './SurveyListClient';

export default async function SurveysPage() {
  const surveys = await db.survey.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { responses: true },
      },
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sondages</h1>
          <p className="mt-1 text-zinc-500">Gérez tous vos sondages</p>
        </div>
        <Link
          href="/surveys/new"
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 hover:shadow-yellow-400/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nouveau sondage
        </Link>
      </div>

      <SurveyListClient surveys={surveys} />
    </div>
  );
}
