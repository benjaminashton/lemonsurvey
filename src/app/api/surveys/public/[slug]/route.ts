import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/surveys/public/[slug]'>
) {
  try {
    const { slug } = await ctx.params;

    const survey = await db.survey.findUnique({
      where: { slug },
      include: {
        groups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            questions: {
              orderBy: { sortOrder: 'asc' },
              include: {
                choices: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!survey || survey.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Sondage introuvable ou inactif' },
        { status: 404 }
      );
    }

    // Check if survey has expired
    if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Ce sondage a expiré' },
        { status: 410 }
      );
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error('Failed to fetch public survey:', error);
    return NextResponse.json(
      { success: false, error: 'Échec de la récupération du sondage' },
      { status: 500 }
    );
  }
}
