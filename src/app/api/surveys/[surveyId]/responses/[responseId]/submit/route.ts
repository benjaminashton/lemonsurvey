import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submitResponseSchema } from '@/lib/validators/response';
import { processRoutingRules } from '@/lib/routing/evaluator';

export async function POST(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId, responseId } = await ctx.params;
    const body = await request.json();
    const validated = submitResponseSchema.parse({ ...body, surveyId });

    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    if (!survey || survey.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Ce sondage n\'est pas actif' }, { status: 400 });
    }

    const response = await db.surveyResponse.findUnique({ where: { id: responseId } });
    if (!response || response.surveyId !== surveyId) {
      return NextResponse.json({ success: false, error: 'Réponse introuvable' }, { status: 404 });
    }

    if (response.isComplete) {
      return NextResponse.json({ success: false, error: 'La réponse est déjà complétée' }, { status: 400 });
    }

    // Convert validated answers to actual rows
    await db.$transaction(async (tx) => {
      // First delete any existing answers just in case
      await tx.answer.deleteMany({ where: { responseId } });

      await tx.surveyResponse.update({
        where: { id: responseId },
        data: {
          isComplete: true,
          submittedAt: new Date(),
          partialData: {},
          answers: {
            create: validated.answers.map((answer) => ({
              questionId: answer.questionId,
              textValue: answer.textValue ?? null,
              choiceValues: answer.choiceValues ?? [],
              numericValue: answer.numericValue ?? null,
              fileUrl: answer.fileUrl ?? null,
            })),
          },
        },
      });

      if (response.participantId) {
        await tx.participant.update({
          where: { id: response.participantId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    });

    // Process routing
    processRoutingRules(surveyId, responseId).catch((err) => {
      console.error('Routing evaluation failed to trigger:', err);
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to submit response:', error);
    return NextResponse.json({ success: false, error: 'Échec de la soumission de la réponse' }, { status: 500 });
  }
}
