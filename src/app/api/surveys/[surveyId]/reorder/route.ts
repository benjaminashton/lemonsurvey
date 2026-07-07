import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const reorderSchema = z.object({
  groups: z
    .array(
      z.object({
        id: z.string(),
        sortOrder: z.number().int(),
      })
    )
    .optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        sortOrder: z.number().int(),
        groupId: z.string().optional(),
        code: z.string().optional(),
        relevance: z.any().optional(),
        equation: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export async function PUT(
  request: NextRequest,
  ctx: any
) {
  try {
    const { surveyId } = await ctx.params;
    const body = await request.json();
    const { groups, questions } = reorderSchema.parse(body);

    await db.$transaction(async (tx) => {
      // Step 1: Assign temporary unique values to avoid unique constraint violations
      if (groups) {
        for (const g of groups) {
          await tx.questionGroup.update({
            where: { id: g.id },
            data: { sortOrder: -(g.sortOrder + 10000) }, // temporary sort order
          });
        }
      }
      if (questions) {
        for (const q of questions) {
          await tx.question.update({
            where: { id: q.id },
            data: {
              sortOrder: -(q.sortOrder + 10000),
              ...(q.code ? { code: `_tmp_${q.code}_${q.id}` } : {}),
            },
          });
        }
      }

      // Step 2: Assign final values
      if (groups) {
        for (const g of groups) {
          await tx.questionGroup.update({
            where: { id: g.id },
            data: { sortOrder: g.sortOrder },
          });
        }
      }
      if (questions) {
        for (const q of questions) {
          await tx.question.update({
            where: { id: q.id },
            data: {
              sortOrder: q.sortOrder,
              ...(q.groupId ? { groupId: q.groupId } : {}),
              ...(q.code ? { code: q.code } : {}),
              ...(q.relevance !== undefined ? { relevance: q.relevance ?? Prisma.DbNull } : {}),
              ...(q.equation !== undefined ? { equation: q.equation } : {}),
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder' },
      { status: 500 }
    );
  }
}
