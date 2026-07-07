import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createQuestionSchema } from '@/lib/validators/question';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/questions'>
) {
  try {
    const { groupId } = await ctx.params;
    const body = await request.json();
    const validated = createQuestionSchema.parse({ ...body, groupId });

    // Auto-assign sortOrder
    const maxQuestion = await db.question.findFirst({
      where: { groupId },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = validated.sortOrder || (maxQuestion?.sortOrder ?? -1) + 1;

    const { choices, ...questionData } = validated;

    const question = await db.question.create({
      data: {
        ...questionData,
        sortOrder,
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
      include: { choices: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
