import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    // Only SUPER_ADMIN or ADMIN allowed
    if (!session?.user?.id || session.user.role === 'USER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { defaultLanguage, timezone, defaultAllowBack } = body;

    const updates: any = {};
    if (defaultLanguage !== undefined) updates.defaultLanguage = defaultLanguage;
    if (timezone !== undefined) updates.timezone = timezone;
    if (defaultAllowBack !== undefined) updates.defaultAllowBack = defaultAllowBack;

    await db.platformSettings.upsert({
      where: { id: 'global' },
      update: updates,
      create: {
        id: 'global',
        ...updates
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to update preferences:', err);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
