import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = forgotPasswordSchema.parse(body);

    const isEmail = identifier.includes('@');
    
    const user = await db.user.findFirst({
      where: isEmail
        ? { email: identifier }
        : { username: identifier }
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne dit pas si l'utilisateur existe ou non
      return NextResponse.json({ success: true });
    }

    // Génère un token et défini une expiration d'une heure
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Sauvegarde en base de données
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      }
    });
    
    // Si l'application est déployée, utiliser l'URL de base réelle
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe LemonSurvey',
      html: `
        <div style="font-family: sans-serif; max-w-xl mx-auto text-gray-800">
          <h2>Bonjour ${user.name || user.username || 'Utilisateur'},</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valide pendant 1 heure.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #facc15; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="font-size: 13px; color: #666;">Si le bouton ne fonctionne pas, copiez-collez le lien suivant dans votre navigateur :<br/>
          <a href="${resetLink}">${resetLink}</a></p>
          <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process forgot password:', error);
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
