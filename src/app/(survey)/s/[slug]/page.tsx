import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { SurveyRenderer } from '@/components/survey/SurveyRenderer';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';

export async function generateMetadata(
  props: PageProps<'/s/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params;
  const survey = await db.survey.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  return {
    title: survey ? `${survey.title} — LemonSurvey` : 'Sondage introuvable',
    description: survey?.description ?? 'Compléter ce sondage',
  };
}

export default async function SurveyTakePage(
  props: { params: Promise<{ slug: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const isPreview = searchParams?.preview === 'true';
  const token = typeof searchParams?.token === 'string' ? searchParams.token : undefined;

  const survey = await db.survey.findUnique({
    where: { slug },
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

  if (survey && !isPreview) {
    await db.survey.update({
      where: { id: survey.id },
      data: { views: { increment: 1 } }
    });
  }

  if (!survey || (survey.status !== 'ACTIVE' && !isPreview)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-300">Sondage indisponible</h1>
          <p className="mt-2 text-zinc-500">Ce sondage n'est pas actif actuellement ou n'existe pas.</p>
        </div>
      </div>
    );
  }

  if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-300">Sondage expiré</h1>
          <p className="mt-2 text-zinc-500">Ce sondage n'accepte plus de réponses.</p>
        </div>
      </div>
    );
  }

  let initialData: { responseId: string; answers: any; currentPage: number } | undefined;
  let session = null;

  if (!isPreview) {
    session = await auth();
    if (!session?.user?.id) {
      redirect(`/s/${slug}/login`);
    }

    const userId = session.user.id;
    const email = session.user.email as string;

    let participant = await db.participant.findUnique({
      where: { surveyId_email: { surveyId: survey.id, email } }
    });

    if (!participant) {
      participant = await db.participant.create({
        data: {
          surveyId: survey.id,
          email,
          userId,
          status: 'STARTED',
        }
      });
    }

    let response = await db.surveyResponse.findUnique({
      where: { participantId: participant.id }
    });

    if (!response) {
      response = await db.surveyResponse.create({
        data: {
          surveyId: survey.id,
          participantId: participant.id,
          isComplete: false,
          lastPage: 0,
          partialData: {},
        }
      });
    } else if (response.isComplete) {
      // Si la réponse est déjà complète
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-300">Merci !</h1>
            <p className="mt-2 text-zinc-500">Vous avez déjà complété ce sondage.</p>
          </div>
        </div>
      );
    }

    initialData = {
      responseId: response.id,
      answers: response.partialData || {},
      currentPage: response.lastPage || 0
    };
  }

  return (
    <SurveyRenderer 
      survey={JSON.parse(JSON.stringify(survey))} 
      isPreview={isPreview} 
      token={token} 
      initialData={initialData}
      userEmail={!isPreview && session?.user ? session.user.email as string : undefined}
    />
  );
}
