import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ResponsesViewer } from '@/components/admin/ResponsesViewer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ResponsesPage(
  props: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId } = await props.params;

  const survey = await db.survey.findUnique({
    where: { id: surveyId },
    select: { id: true, title: true },
  });

  if (!survey) notFound();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      {/* Top Bar */}
      <div className="flex h-14 shrink-0 items-center border-b border-zinc-800/80 px-6">
        <Link
          href={`/surveys/${survey.id}/edit`}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'éditeur
        </Link>
        <div className="mx-4 h-5 w-px bg-zinc-800" />
        <h1 className="text-sm font-semibold text-zinc-200">
          Réponses : {survey.title}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        <ResponsesViewer surveyId={survey.id} />
      </div>
    </div>
  );
}
