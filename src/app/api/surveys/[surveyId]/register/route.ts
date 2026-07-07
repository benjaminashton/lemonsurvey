import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest, ctx: any) {
  try {
    const { surveyId: slug } = await ctx.params;
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const survey = await db.survey.findUnique({
      where: { slug }
    });

    if (!survey) {
      return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        email: email.trim(),
        passwordHash,
        role: 'RESPONDENT',
        name: email.split('@')[0], // default name
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
  }
}
