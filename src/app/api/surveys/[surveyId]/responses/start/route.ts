import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId } = await ctx.params;
    const body = await request.json().catch(() => ({}));

    // Verify survey is active
    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    if (!survey || survey.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Ce sondage n\'est pas actif' }, { status: 400 });
    }

    if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'Ce sondage a expiré' }, { status: 410 });
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    // If token is required, find participant
    let participantId: string | null = null;
    if (body.participantToken) {
      const participant = await db.participant.findUnique({ where: { token: body.participantToken } });
      if (!participant || participant.surveyId !== surveyId) {
        return NextResponse.json({ success: false, error: 'Jeton de participant invalide' }, { status: 403 });
      }
      if (participant.status === 'COMPLETED') {
        return NextResponse.json({ success: false, error: 'Vous avez déjà complété ce sondage' }, { status: 400 });
      }
      participantId = participant.id;
    } else if (survey.requireToken) {
      return NextResponse.json({ success: false, error: 'Un jeton valide est requis pour ce sondage' }, { status: 403 });
    }

    // Create a blank response
    const response = await db.surveyResponse.create({
      data: {
        surveyId,
        participantId,
        ipAddress,
        userAgent,
        isComplete: false,
        lastPage: 0,
        partialData: {}
      }
    });

    if (participantId) {
      await db.participant.update({
        where: { id: participantId },
        data: { status: 'STARTED', startedAt: new Date() }
      });
    }

    return NextResponse.json({ success: true, data: { rid: response.id } }, { status: 201 });
  } catch (error) {
    console.error('Failed to start response:', error);
    return NextResponse.json({ success: false, error: 'Échec de la création de la réponse' }, { status: 500 });
  }
}
