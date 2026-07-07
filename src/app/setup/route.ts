import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    let message = 'Setup complete!';
    const passwordHash = await bcrypt.hash('password123', 10);

    const adminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } });
    if (adminCount === 0) {
      await db.user.create({
        data: {
          email: 'admin',
          name: 'Admin Global',
          passwordHash,
          role: 'SUPER_ADMIN',
        },
      });
      message += ' Admin created.';
    }

    const userCount = await db.user.count({ where: { role: 'USER' } });
    if (userCount === 0) {
      await db.user.create({
        data: {
          email: 'user',
          name: 'Utilisateur Standard',
          passwordHash,
          role: 'USER',
        },
      });
      message += ' User created.';
    }

    if (adminCount > 0 && userCount > 0) {
      return NextResponse.json({ message: 'Database already seeded with users.' });
    }

    return NextResponse.json({
      message,
      accounts: [
        { email: 'admin', password: 'password123', role: 'SUPER_ADMIN' },
        { email: 'user', password: 'password123', role: 'USER' }
      ]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
