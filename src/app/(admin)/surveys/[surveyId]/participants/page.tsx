import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ParticipantManager } from '@/components/admin/ParticipantManager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ParticipantsPage(
  props: PageProps<'/surveys/[surveyId]/participants'>
) {
  const { surveyId } = await props.params;

  const survey = await db.survey.findUnique({
    where: { id: surveyId },
    select: { id: true, title: true, slug: true, requireToken: true },
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
          Back to Builder
        </Link>
        <div className="mx-4 h-5 w-px bg-zinc-800" />
        <h1 className="text-sm font-semibold text-zinc-200">
          Participants: {survey.title}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        <ParticipantManager surveyId={survey.id} surveySlug={survey.slug} requireToken={survey.requireToken} />
      </div>
    </div>
  );
}
