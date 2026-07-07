import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    // Only SUPER_ADMIN or ADMIN might be allowed to change platform settings
    if (!session?.user?.id || session.user.role === 'USER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { companyName, brandColor } = body;

    const updates: any = {};
    if (companyName !== undefined) updates.companyName = companyName;
    if (brandColor !== undefined) updates.brandColor = brandColor;

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
    console.error('Failed to update appearance settings:', err);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
