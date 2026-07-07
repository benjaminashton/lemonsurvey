import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId, responseId } = await ctx.params;

    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      return NextResponse.json({ success: false, error: 'Sondage introuvable' }, { status: 404 });
    }

    const response = await db.surveyResponse.findUnique({ where: { id: responseId } });
    if (!response) {
      return NextResponse.json({ success: false, error: 'Réponse introuvable' }, { status: 404 });
    }

    await db.surveyResponse.delete({
      where: { id: responseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete response:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur interne' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId, responseId } = await ctx.params;
    const body = await request.json();
    const { partialData, lastPage } = body;

    const response = await db.surveyResponse.findUnique({ where: { id: responseId } });
    if (!response || response.surveyId !== surveyId) {
      return NextResponse.json({ success: false, error: 'Réponse introuvable' }, { status: 404 });
    }

    if (response.isComplete) {
      return NextResponse.json({ success: false, error: 'La réponse est déjà complétée' }, { status: 400 });
    }

    await db.surveyResponse.update({
      where: { id: responseId },
      data: {
        partialData: partialData ?? response.partialData,
        lastPage: lastPage ?? response.lastPage
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to autosave response:', error);
    return NextResponse.json({ success: false, error: 'Échec de la sauvegarde' }, { status: 500 });
  }
}
