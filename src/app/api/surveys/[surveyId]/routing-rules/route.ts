import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createRoutingRuleSchema } from '@/lib/validators/routing';

export async function GET(
  _request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId } = await ctx.params;
    const rules = await db.routingRule.findMany({
      where: { surveyId },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error('Failed to fetch routing rules:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId } = await ctx.params;
    const body = await request.json();
    const validated = createRoutingRuleSchema.parse(body);

    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      return NextResponse.json({ success: false, error: 'Survey not found' }, { status: 404 });
    }

    const lastRule = await db.routingRule.findFirst({
      where: { surveyId },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = lastRule ? lastRule.sortOrder + 1 : 0;

    const rule = await db.routingRule.create({
      data: {
        ...validated,
        condition: validated.condition as any,
        webhookHeaders: validated.webhookHeaders as any,
        surveyId,
        sortOrder,
      },
    });

    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error) {
    console.error('Failed to create routing rule:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
