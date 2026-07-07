import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SettingsClient } from './SettingsClient';
import { UserRole } from '@/types';

export default async function SettingsPage() {
  const session = await auth();
  const role = (session?.user?.role as UserRole) || 'ADMIN';
  const userId = session?.user?.id;

  let userData = { email: '', username: '' };
  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) {
      userData = { email: user.email || '', username: user.username || '' };
    }
  }

  const platformSettings = await db.platformSettings.findUnique({ where: { id: 'global' } });
  const initialSettings = {
    companyName: platformSettings?.companyName || 'LemonSurvey',
    brandColor: platformSettings?.brandColor || '#facc15',
    defaultLanguage: platformSettings?.defaultLanguage || 'fr',
    timezone: platformSettings?.timezone || 'Europe/Paris',
    defaultAllowBack: platformSettings?.defaultAllowBack ?? true,
  };

  return (
    <div className="animate-fade-in pb-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-100">
        Paramètres
      </h1>
      <SettingsClient userRole={role} initialUserData={userData} initialSettings={initialSettings} />
    </div>
  );
}
