import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createParticipantSchema } from '@/lib/validators/participant';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/surveys/[surveyId]/participants'>
) {
  try {
    const { surveyId } = await ctx.params;
    const participants = await db.participant.findMany({
      where: { surveyId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: participants });
  } catch (error) {
    console.error('Failed to fetch participants:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/surveys/[surveyId]/participants'>
) {
  try {
    const { surveyId } = await ctx.params;
    const body = await request.json();
    const validated = createParticipantSchema.parse(body);

    // Check if participant already exists for this survey
    const existing = await db.participant.findUnique({
      where: {
        surveyId_email: {
          surveyId,
          email: validated.email,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Participant with this email already exists for this survey' },
        { status: 400 }
      );
    }

    const participant = await db.participant.create({
      data: {
        ...validated,
        surveyId,
      },
    });

    return NextResponse.json({ success: true, data: participant }, { status: 201 });
  } catch (error) {
    console.error('Failed to create participant:', error);
    return NextResponse.json({ success: false, error: 'Failed to create' }, { status: 500 });
  }
}
