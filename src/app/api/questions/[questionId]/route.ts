import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateQuestionSchema } from '@/lib/validators/question';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/questions/[questionId]'>
) {
  try {
    const { questionId } = await ctx.params;
    const question = await db.question.findUnique({
      where: { id: questionId },
      include: { choices: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error('Failed to fetch question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/questions/[questionId]'>
) {
  try {
    const { questionId } = await ctx.params;
    const body = await request.json();
    const validated = updateQuestionSchema.parse(body);
    const { choices, ...questionData } = validated;

    // If choices are provided, delete existing and recreate
    if (choices !== undefined) {
      await db.$transaction(async (tx) => {
        await tx.questionChoice.deleteMany({ where: { questionId } });
        await tx.question.update({
          where: { id: questionId },
          data: {
            ...questionData,
            choices:
              choices && choices.length > 0
                ? {
                    create: choices.map((c, i) => ({
                      code: c.code,
                      label: c.label,
                      value: c.value,
                      sortOrder: c.sortOrder ?? i,
                      attachedAsset: c.attachedAsset ?? undefined,
                    })),
                  }
                : undefined,
          },
        });
      });
    } else {
      await db.question.update({
        where: { id: questionId },
        data: questionData,
      });
    }

    const updated = await db.question.findUnique({
      where: { id: questionId },
      include: { choices: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/questions/[questionId]'>
) {
  try {
    const { questionId } = await ctx.params;
    await db.question.delete({ where: { id: questionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
