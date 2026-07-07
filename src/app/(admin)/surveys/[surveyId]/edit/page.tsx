import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { SurveyBuilder } from '@/components/admin/SurveyBuilder';

export default async function SurveyEditPage(
  props: PageProps<'/surveys/[surveyId]/edit'>
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

  return <SurveyBuilder initialSurvey={JSON.parse(JSON.stringify(survey))} />;
}
