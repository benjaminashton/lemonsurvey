import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { RoutingRulesManager } from '@/components/admin/RoutingRulesManager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type LocalPageProps = {
  params: Promise<{ surveyId: string }>;
};

export default async function RoutingRulesPage(
  props: LocalPageProps
) {
  const { surveyId } = await props.params;

  const survey = await db.survey.findUnique({
    where: { id: surveyId },
    include: {
      groups: {
        orderBy: { sortOrder: 'asc' },
        include: {
          questions: {
            orderBy: { sortOrder: 'asc' },
            include: { choices: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      },
    },
  });

  if (!survey) notFound();

  // Extract available questions for the RelevanceEditor
  const availableQuestions = survey.groups.flatMap((g) =>
    g.questions.map((q) => ({
      code: q.code,
      text: q.text,
      type: q.type,
      choices: q.choices.map((c) => ({
        code: c.code,
        label: c.label,
        value: c.value || c.code,
      })),
    }))
  );

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
          Règles de routage : {survey.title}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <RoutingRulesManager
          surveyId={survey.id}
          availableQuestions={availableQuestions}
        />
      </div>
    </div>
  );
}
