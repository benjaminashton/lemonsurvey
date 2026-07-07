import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submitResponseSchema } from '@/lib/validators/response';
import { processRoutingRules } from '@/lib/routing/evaluator';

export async function POST(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId } = await ctx.params;
    const body = await request.json();
    const validated = submitResponseSchema.parse({ ...body, surveyId });

    // Verify survey is active
    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    if (!survey || survey.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Ce sondage n\'est pas actif' },
        { status: 400 }
      );
    }

    // Check expiry
    if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Ce sondage a expiré' },
        { status: 410 }
      );
    }

    // If token required, validate participant
    let participantId: string | null = null;
    if (validated.participantToken) {
      const participant = await db.participant.findUnique({
        where: { token: validated.participantToken },
      });

      if (!participant || participant.surveyId !== surveyId) {
        return NextResponse.json(
          { success: false, error: 'Jeton de participant invalide' },
          { status: 403 }
        );
      }

      if (participant.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Vous avez déjà complété ce sondage' },
          { status: 400 }
        );
      }

      participantId = participant.id;
    } else if (survey.requireToken) {
      return NextResponse.json(
        { success: false, error: 'Un jeton valide est requis pour ce sondage' },
        { status: 403 }
      );
    }

    // Get IP and user agent
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    // Create response with answers in a transaction
    const response = await db.$transaction(async (tx) => {
      const surveyResponse = await tx.surveyResponse.create({
        data: {
          surveyId,
          participantId,
          ipAddress,
          userAgent,
          isComplete: true,
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
        include: { answers: true },
      });

      // Update participant status if applicable
      if (participantId) {
        await tx.participant.update({
          where: { id: participantId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }

      return surveyResponse;
    });

    // Fire and forget routing rules
    processRoutingRules(surveyId, response.id).catch((err) => {
      console.error('Routing evaluation failed to trigger:', err);
    });

    return NextResponse.json(
      { success: true, data: { id: response.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to submit response:', error);
    return NextResponse.json(
      { success: false, error: 'Échec de la soumission de la réponse' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/surveys/[surveyId]/responses'>
) {
  try {
    const { surveyId } = await ctx.params;
    
    // Fetch survey and its questions (to know the columns)
    const survey = await db.survey.findUnique({
      where: { id: surveyId },
      select: {
        id: true,
        title: true,
        groups: {
          orderBy: { sortOrder: 'asc' },
          select: {
            questions: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, code: true, text: true, type: true, choices: true }
            }
          }
        }
      }
    });

    if (!survey) return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 });

    const questions = survey.groups.flatMap(g => g.questions);

    const responses = await db.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { submittedAt: 'desc' },
      include: {
        participant: { select: { email: true } },
        answers: true
      }
    });

    return NextResponse.json({ success: true, data: { survey: { ...survey, questions }, responses } });
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    return NextResponse.json({ success: false, error: 'Échec de la récupération' }, { status: 500 });
  }
}
