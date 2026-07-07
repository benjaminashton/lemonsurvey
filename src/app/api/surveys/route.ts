import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSurveySchema } from '@/lib/validators/survey';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

export async function GET() {
  try {
    const surveys = await db.survey.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            groups: true,
            participants: true,
            responses: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: surveys });
  } catch (error) {
    console.error('Failed to fetch surveys:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSurveySchema.parse(body);

    let slug = slugify(validated.title);
    const existing = await db.survey.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // TODO: Replace with actual authenticated user ID
    const TEMP_USER_ID = 'temp-admin';

    // Ensure temp user exists for development
    await db.user.upsert({
      where: { id: TEMP_USER_ID },
      update: {},
      create: {
        id: TEMP_USER_ID,
        email: 'admin@lemonsurvey.dev',
        name: 'Admin',
        passwordHash: 'dev-placeholder',
      },
    });

    const survey = await db.survey.create({
      data: {
        ...validated,
        slug,
        createdById: TEMP_USER_ID,
      },
    });

    return NextResponse.json({ success: true, data: survey }, { status: 201 });
  } catch (error) {
    console.error('Failed to create survey:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create survey' },
      { status: 500 }
    );
  }
}
