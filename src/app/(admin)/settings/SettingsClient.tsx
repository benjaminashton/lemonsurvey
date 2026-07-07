'use client';

import { useState } from 'react';
import { User, Palette, Globe, Key, Bell, Save, Loader2, Upload, MonitorSmartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Tab = 'profile' | 'appearance' | 'preferences';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profil & Compte', icon: User },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'preferences', label: 'Préférences', icon: Globe },
];

export function SettingsClient({
  userRole,
  initialUserData,
  initialSettings
}: {
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  initialUserData?: { email: string; username: string };
  initialSettings?: { 
    companyName: string; 
    brandColor: string;
    defaultLanguage: string;
    timezone: string;
    defaultAllowBack: boolean;
  };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter tabs based on role
  const visibleTabs = TABS.filter(tab => {
    if (userRole === 'USER' && (tab.id === 'preferences' || tab.id === 'appearance')) {
      return false;
    }
    return true;
  });

  // Ensure active tab is valid
  if (userRole === 'USER' && (activeTab === 'preferences' || activeTab === 'appearance')) {
    setActiveTab('profile');
  }

  // State for forms
  const [form, setForm] = useState({
    email: initialUserData?.email || '',
    username: initialUserData?.username || '',
    currentPassword: '',
    newPassword: '',
    companyName: initialSettings?.companyName || 'LemonSurvey',
    brandColor: initialSettings?.brandColor || '#facc15',
    language: initialSettings?.defaultLanguage || 'fr',
    timezone: initialSettings?.timezone || 'Europe/Paris',
    defaultAllowBack: initialSettings?.defaultAllowBack ?? true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    if (activeTab === 'profile') {
      try {
        const res = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            username: form.username,
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur lors de la sauvegarde');
        }

        setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsSaving(false);
      }
    } else if (activeTab === 'appearance') {
      try {
        const res = await fetch('/api/settings/appearance', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: form.companyName,
            brandColor: form.brandColor,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur lors de la sauvegarde');
        }

        router.refresh();
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsSaving(false);
      }
    } else if (activeTab === 'preferences') {
      try {
        const res = await fetch('/api/settings/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            defaultLanguage: form.language,
            timezone: form.timezone,
            defaultAllowBack: form.defaultAllowBack,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur lors de la sauvegarde');
        }

        router.refresh();
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Simulate API call for other tabs
      await new Promise((r) => setTimeout(r, 1000));
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full shrink-0 md:w-64 space-y-6">
        <nav className="flex flex-col gap-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-black' : 'text-zinc-500')} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 glass-card rounded-2xl p-6 md:p-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Gérez vos paramètres et préférences.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : showSaved ? (
              <Save className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {showSaved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>

        <div className="animate-fade-in space-y-8">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {activeTab === 'profile' && visibleTabs.some(t => t.id === 'profile') && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-400">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-400">Adresse email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                  />
                </div>
              </div>

              <hr className="border-zinc-800/60" />

              <div>
                <h3 className="mb-4 text-sm font-medium text-zinc-300">Changer de mot de passe</h3>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Mot de passe actuel"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                  />
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && visibleTabs.some(t => t.id === 'appearance') && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">Nom de l'entreprise</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="mb-4 text-sm font-medium text-zinc-400">Logo de l'entreprise</h3>
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 transition-colors hover:border-yellow-400/40 hover:bg-zinc-800/50">
                    <Upload className="mb-2 h-6 w-6 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-400">Cliquez pour téléverser</span>
                    <span className="text-xs text-zinc-600">PNG, JPG, SVG jusqu'à 2MB</span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-sm font-medium text-zinc-400">Couleur principale</h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={form.brandColor}
                      onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                      className="h-12 w-24 cursor-pointer rounded bg-transparent outline-none"
                    />
                    <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                      <div className="flex items-center gap-2">
                        <MonitorSmartphone className="h-4 w-4 text-zinc-500" />
                        <span className="text-xs text-zinc-400">Aperçu</span>
                      </div>
                      <button
                        className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
                        style={{ backgroundColor: form.brandColor }}
                      >
                        Bouton d'action
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'preferences' && visibleTabs.some(t => t.id === 'preferences') && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">Langue par défaut</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                  <option value="es">Espagnol</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">Fuseau horaire</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                >
                  <option value="Europe/Paris">Europe/Paris (UTC+1/UTC+2)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>

              <hr className="border-zinc-800/60" />

              <div className="flex items-center justify-between max-w-md rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4">
                <div>
                  <h4 className="text-sm font-medium text-zinc-300">Bouton "Retour"</h4>
                  <p className="text-xs text-zinc-500">Autoriser les répondants à revenir en arrière par défaut</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.defaultAllowBack}
                  onClick={() => setForm({ ...form, defaultAllowBack: !form.defaultAllowBack })}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    form.defaultAllowBack ? 'bg-yellow-400' : 'bg-zinc-700'
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      form.defaultAllowBack ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
