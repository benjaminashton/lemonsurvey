import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateParticipantSchema } from '@/lib/validators/participant';
import { createId } from '@paralleldrive/cuid2';

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/participants/[participantId]'>
) {
  try {
    const { participantId } = await ctx.params;
    const body = await request.json();

    if (body.action === 'REGENERATE_TOKEN') {
      const updated = await db.participant.update({
        where: { id: participantId },
        data: { token: createId() },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const validated = updateParticipantSchema.parse(body);
    const updated = await db.participant.update({
      where: { id: participantId },
      data: validated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update participant:', error);
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/participants/[participantId]'>
) {
  try {
    const { participantId } = await ctx.params;
    await db.participant.delete({ where: { id: participantId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete participant:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
