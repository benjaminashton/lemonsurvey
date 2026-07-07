import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateGroupSchema } from '@/lib/validators/group';

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]'>
) {
  try {
    const { groupId } = await ctx.params;
    const body = await request.json();
    const validated = updateGroupSchema.parse(body);

    const group = await db.questionGroup.update({
      where: { id: groupId },
      data: validated,
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { choices: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error('Failed to update group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]'>
) {
  try {
    const { groupId } = await ctx.params;
    await db.questionGroup.delete({ where: { id: groupId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
