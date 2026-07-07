'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Citrus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sondages', href: '/surveys', icon: FileText },
  { label: 'Paramètres', href: '/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-800/80 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800/80 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg lemon-gradient">
          <Citrus className="h-4.5 w-4.5 text-black" />
        </div>
        <span className="text-lg font-bold tracking-tight">
          <span className="lemon-gradient-text">Lemon</span>
          <span className="text-zinc-300">Survey</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-yellow-400/10 text-yellow-400'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              )}
            >
              <item.icon
                className={cn(
                  'h-4.5 w-4.5 transition-colors',
                  isActive
                    ? 'text-yellow-400'
                    : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-yellow-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800/80 p-3 flex items-center gap-2">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
        >
          <LogOut className="h-4.5 w-4.5" />
          Se déconnecter
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
