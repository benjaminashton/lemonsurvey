import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, password } = resetPasswordSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable ou lien invalide.' },
        { status: 400 }
      );
    }

    if (!user.resetToken || user.resetToken !== token) {
      return NextResponse.json(
        { success: false, error: 'Le lien de réinitialisation est invalide.' },
        { status: 400 }
      );
    }

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return NextResponse.json(
        { success: false, error: 'Le lien de réinitialisation a expiré.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reset password:', error);
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la réinitialisation.' },
      { status: 500 }
    );
  }
}
