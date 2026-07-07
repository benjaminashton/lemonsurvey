import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createRoutingRuleSchema } from '@/lib/validators/routing';

export async function DELETE(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId, ruleId } = await ctx.params;

    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      return NextResponse.json({ success: false, error: 'Survey not found' }, { status: 404 });
    }

    await db.routingRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete routing rule:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId, ruleId } = await ctx.params;
    const body = await request.json();
    const validated = createRoutingRuleSchema.parse(body);

    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      return NextResponse.json({ success: false, error: 'Survey not found' }, { status: 404 });
    }

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

export async function PATCH(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId, ruleId } = await ctx.params;
    const body = await request.json();

    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      return NextResponse.json({ success: false, error: 'Survey not found' }, { status: 404 });
    }

    const rule = await db.routingRule.update({
      where: { id: ruleId },
      data: {
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('Failed to patch routing rule:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
