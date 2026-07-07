import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { email, username, currentPassword, newPassword } = body;

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const updates: any = {};
    
    if (email !== undefined && email.trim() !== '') {
      const existing = await db.user.findUnique({ where: { email: email.trim() } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Cette adresse email est déjà prise' }, { status: 400 });
      }
      updates.email = email.trim();
    }
    
    if (username !== undefined && username.trim() !== '') {
      const existing = await db.user.findUnique({ where: { username: username.trim() } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 400 });
      }
      updates.username = username.trim();
    }

    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Mot de passe actuel requis pour le changer' }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await db.user.update({
      where: { id: user.id },
      data: updates,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to update user profile:', err);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
