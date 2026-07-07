import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const shareSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(request: NextRequest, ctx: any) {
  try {
    const { surveyId } = await ctx.params;
    const body = await request.json();
    
    const validated = shareSchema.parse(body);

    const survey = await db.survey.findUnique({
      where: { id: surveyId },
      select: { id: true, status: true }
    });

    if (!survey || survey.status === 'DRAFT') {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez partager qu'un sondage finalisé." },
        { status: 400 }
      );
    }

    // Since text can contain newlines, we convert them to <br> for HTML email
    const htmlMessage = validated.message.replace(/\n/g, '<br/>');

    await sendEmail({
      to: validated.email,
      subject: validated.subject,
      html: `<div>${htmlMessage}</div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send share email:', error);
    return NextResponse.json(
      { success: false, error: 'Échec de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
