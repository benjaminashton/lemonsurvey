import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateSurveySchema } from '@/lib/validators/survey';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/surveys/[surveyId]'>
) {
  try {
    const { surveyId } = await ctx.params;

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
        _count: {
          select: { participants: true, responses: true },
        },
      },
    });

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('Failed to fetch survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch survey' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/surveys/[surveyId]'>
) {
  try {
    const { surveyId } = await ctx.params;
    const body = await request.json();
    const validated = updateSurveySchema.parse(body);

    const survey = await db.survey.update({
      where: { id: surveyId },
      data: validated,
    });

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('Failed to update survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update survey' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/surveys/[surveyId]'>
) {
  try {
    const { surveyId } = await ctx.params;
    await db.survey.delete({ where: { id: surveyId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete survey' },
      { status: 500 }
    );
  }
}
