'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: username,
        password,
      });

      if (res?.error) {
        setError('Identifiants incorrects.');
        setIsLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Une erreur est survenue.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      setError("Veuillez d'abord saisir votre nom d'utilisateur ou adresse email, puis cliquez sur Mot de passe oublié.");
      return;
    }
    
    setIsResetting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username }),
      });
      
      if (res.ok) {
        setSuccess("Si un compte correspond à cet identifiant, un email contenant les instructions a été envoyé à l'adresse associée.");
      } else {
        setError("Une erreur est survenue lors de la demande de réinitialisation.");
      }
    } catch (e) {
      setError("Erreur réseau.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/10 via-zinc-950 to-zinc-950"></div>
      
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-xl shadow-yellow-400/20">
            <Lock className="h-8 w-8 text-black" />
          </div>
          <h1 className="lemon-gradient-text text-3xl font-bold tracking-tight">LemonSurvey</h1>
          <p className="mt-2 text-zinc-500">Connectez-vous à votre espace de gestion</p>
        </div>

        <div className="glass-card overflow-hidden rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-400">Nom d'utilisateur ou Adresse email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                placeholder="admin"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-zinc-400">Mot de passe</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  disabled={isResetting}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50"
                >
                  {isResetting ? 'Envoi...' : 'Mot de passe oublié ?'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 pr-10 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
