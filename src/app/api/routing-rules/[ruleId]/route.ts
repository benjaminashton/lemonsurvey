import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateRoutingRuleSchema } from '@/lib/validators/routing';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const body = await request.json();
    const validated = updateRoutingRuleSchema.parse(body);

    const rule = await db.routingRule.update({
      where: { id: ruleId },
      data: {
        ...validated,
        condition: validated.condition as any,
        webhookHeaders: validated.webhookHeaders as any,
      },
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('Failed to update routing rule:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const { ruleId } = await params;

    await db.routingRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete routing rule:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
