'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Lock } from 'lucide-react';
import { use } from 'react';

export default function SurveyLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (isRegistering) {
      try {
        const res = await fetch(`/api/surveys/${resolvedParams.slug}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Erreur lors de la création du compte');
          setIsLoading(false);
          return;
        }
        
        // Registration successful, now sign in
        const signInRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInRes?.error) {
          setError('Erreur lors de la connexion automatique.');
          setIsLoading(false);
        } else {
          router.push(`/s/${resolvedParams.slug}`);
          router.refresh();
        }
      } catch (err) {
        setError('Erreur réseau.');
        setIsLoading(false);
      }
    } else {
      try {
        const res = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          setError('Identifiants incorrects.');
          setIsLoading(false);
        } else {
          router.push(`/s/${resolvedParams.slug}`);
          router.refresh();
        }
      } catch (err) {
        setError('Une erreur est survenue.');
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Veuillez saisir votre adresse email, puis cliquez sur Mot de passe oublié.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email }),
      });
      
      if (res.ok) {
        setSuccess("Si un compte correspond à cette adresse, un email contenant les instructions a été envoyé.");
      } else {
        setError("Une erreur est survenue lors de la demande de réinitialisation.");
      }
    } catch (e) {
      setError("Erreur réseau.");
    } finally {
      setIsLoading(false);
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
          <h1 className="lemon-gradient-text text-3xl font-bold tracking-tight">
            {isRegistering ? 'Créer un compte' : 'Connexion'}
          </h1>
          <p className="mt-2 text-zinc-500">
            {isRegistering 
              ? "Créez votre compte pour répondre au sondage et sauvegarder votre progression." 
              : "Connectez-vous pour continuer votre sondage."}
          </p>
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
              <label className="mb-2 block text-sm font-medium text-zinc-400">Adresse email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-zinc-400">Mot de passe</label>
                {!isRegistering && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
                placeholder="••••••••"
              />
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
                  {isRegistering ? "S'inscrire" : "Se connecter"}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            
            <div className="mt-6 text-center text-sm text-zinc-500">
              {isRegistering ? "Vous avez déjà un compte ?" : "Nouveau ?"}
              {' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                {isRegistering ? "Connectez-vous ici" : "Créez-en un ici"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
