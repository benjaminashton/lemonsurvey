import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/surveys/public/[slug]/validate-token'>
) {
  try {
    const { slug } = await ctx.params;
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Le jeton est requis' },
        { status: 400 }
      );
    }

    const survey = await db.survey.findUnique({ where: { slug } });
    if (!survey || survey.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Sondage introuvable ou inactif' },
        { status: 404 }
      );
    }

    const participant = await db.participant.findUnique({
      where: { token },
    });

    if (!participant || participant.surveyId !== survey.id) {
      return NextResponse.json(
        { success: false, error: 'Jeton invalide' },
        { status: 403 }
      );
    }

    if (participant.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Vous avez déjà complété ce sondage' },
        { status: 400 }
      );
    }

    // Mark as started
    if (participant.status === 'PENDING' || participant.status === 'INVITED') {
      await db.participant.update({
        where: { id: participant.id },
        data: { status: 'STARTED', startedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        participantId: participant.id,
        firstName: participant.firstName,
        email: participant.email,
      },
    });
  } catch (error) {
    console.error('Failed to validate token:', error);
    return NextResponse.json(
      { success: false, error: 'Échec de la validation du jeton' },
      { status: 500 }
    );
  }
}
