import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createGroupSchema } from '@/lib/validators/group';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/surveys/[surveyId]/groups'>
) {
  try {
    const { surveyId } = await ctx.params;
    const groups = await db.questionGroup.findMany({
      where: { surveyId },
      orderBy: { sortOrder: 'asc' },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { choices: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/surveys/[surveyId]/groups'>
) {
  try {
    const { surveyId } = await ctx.params;
    const body = await request.json();
    const validated = createGroupSchema.parse(body);

    // Auto-assign sortOrder if not provided (max + 1)
    let sortOrder = validated.sortOrder;
    if (sortOrder === 0) {
      const maxGroup = await db.questionGroup.findFirst({
        where: { surveyId },
        orderBy: { sortOrder: 'desc' },
      });
      sortOrder = (maxGroup?.sortOrder ?? -1) + 1;
    }

    const group = await db.questionGroup.create({
      data: {
        ...validated,
        sortOrder,
        surveyId,
      },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { choices: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (error) {
    console.error('Failed to create group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
