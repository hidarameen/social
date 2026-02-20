'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Activity,
  LogOut,
  Menu,
  PanelLeftClose,
  Sparkles,
  UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNavItemContent, NAV_ITEMS } from '@/components/layout/nav-items';
import { useShellPreferences } from '@/components/layout/shell-provider';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/common/app-logo';
import { useLanguage } from '@/components/i18n/language-provider';
import { useSession } from 'next-auth/react';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useShellPreferences();
  const { locale, t } = useLanguage();
  const { data: session } = useSession();
  const profileName = String(session?.user?.name || '').trim();
  const firstName = profileName ? profileName.split(/\s+/)[0] : '';

  const isActiveItem = (href: string) => {
    const [baseHref, query] = href.split('?');
    const pathMatch =
      baseHref === '/'
        ? pathname === baseHref
        : pathname === baseHref || pathname.startsWith(`${baseHref}/`);
    if (!pathMatch) return false;

    if (!query) {
      if (baseHref === '/tasks' && searchParams.get('create') === '1') return false;
      return true;
    }

    const expected = new URLSearchParams(query);
    for (const [key, value] of expected.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  };

  return (
    <aside
      className="shell-sidebar relative hidden h-screen w-[var(--shell-sidebar-width)] flex-col overflow-hidden border-r border-sidebar-border/80 md:fixed md:top-0 md:z-30 md:[inset-inline-start:0] md:flex"
      style={{ borderInlineEndWidth: 'var(--shell-sidebar-border-width)' }}
    >
      <div className="shell-sidebar__backdrop" />

      <div className="shell-brand border-b border-sidebar-border/80 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          {sidebarCollapsed ? (
            <AppLogo size={32} showText={false} />
          ) : (
            <div className="kpi-pill w-fit gap-2">
              <Sparkles size={14} />
              {t('sidebar.controlCenter', 'Control Center')}
            </div>
          )}
        </div>

        {!sidebarCollapsed ? (
          <>
            <div className="mb-2 flex items-center gap-2">
              <span className="shell-brand-orb" aria-hidden />
              <AppLogo
                size={30}
                text={t('sidebar.orbitTitle', 'SocialFlow Orbit')}
                textClassName="text-xl font-semibold tracking-tight text-sidebar-foreground"
              />
            </div>
            <p className="text-sm text-sidebar-foreground/70">
              {t('sidebar.orbitSubtitle', 'Next-gen multi-platform automation cockpit')}
            </p>
          </>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className={cn(
              'shell-nav-link shell-nav-link--toggle group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all duration-300',
              sidebarCollapsed ? 'justify-center' : 'justify-start'
            )}
            title={
              sidebarCollapsed
                ? t('sidebar.expandSidebar', 'Expand sidebar')
                : t('sidebar.collapseSidebar', 'Collapse sidebar')
            }
            aria-label={
              sidebarCollapsed
                ? t('sidebar.expandSidebar', 'Expand sidebar')
                : t('sidebar.collapseSidebar', 'Collapse sidebar')
            }
          >
            <span className="shell-nav-link__icon">
              {sidebarCollapsed ? <Menu size={16} /> : <PanelLeftClose size={16} />}
            </span>
            {!sidebarCollapsed && (
              <span className="shell-nav-link__meta">
                <span className="shell-nav-link__label">{t('sidebar.toggleSidebar', 'Toggle Sidebar')}</span>
                <span className="shell-nav-link__caption">
                  {t('sidebar.toggleSidebarCaption', 'Collapse or expand navigation')}
                </span>
              </span>
            )}
          </button>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item.href);
            const itemContent = getNavItemContent(item, locale);

            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive ? 'true' : 'false'}
                className={cn(
                  'shell-nav-link group relative flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-sm transition-all duration-300 animate-fade-up',
                  sidebarCollapsed ? 'justify-center' : 'justify-start'
                )}
                title={sidebarCollapsed ? itemContent.label : undefined}
              >
                <span className="shell-nav-link__icon">
                  <Icon size={16} />
                </span>
                {!sidebarCollapsed ? (
                  <span className="shell-nav-link__meta min-w-0">
                    <span className="shell-nav-link__label truncate">{itemContent.label}</span>
                    <span className="shell-nav-link__caption truncate">{itemContent.caption}</span>
                  </span>
                ) : null}
                <span className="shell-nav-link__indicator" aria-hidden />
              </Link>
            );
          })}
        </div>
      </nav>

      {!sidebarCollapsed ? (
        <div className="border-t border-sidebar-border/80 p-4">
          <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/45 p-4">
            <div className="mb-2 flex items-center gap-2 text-sidebar-foreground">
              <Activity size={14} className="text-accent animate-pulse-glow rounded-full" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                {t('sidebar.liveStatus', 'Live Status')}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-sidebar-foreground/70">
              {t(
                'sidebar.liveStatusDescription',
                'Runtime healthy. Last sync cycle completed and all services online.'
              )}
            </p>
          </div>
        </div>
      ) : null}

      <div className="shell-sidebar-foot border-t border-sidebar-border/80 p-4">
        <div className={cn('mb-2 flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
          {!sidebarCollapsed ? (
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {firstName || t('header.profile', 'Profile')}
            </span>
          ) : null}
        </div>
        <div className={cn('flex items-center gap-2', sidebarCollapsed ? 'justify-center' : 'justify-start')}>
          <Button
            type="button"
            variant="outline"
            size={sidebarCollapsed ? 'icon' : 'default'}
            className={cn(
              'rounded-xl border-sidebar-border/70 bg-sidebar-accent/45',
              sidebarCollapsed ? 'h-9 w-9' : 'h-9 px-3'
            )}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-profile-settings'));
            }}
            aria-label={t('header.profile', 'Profile')}
            title={t('header.profile', 'Profile')}
          >
            <UserCircle2 size={16} />
            {!sidebarCollapsed ? <span className="max-w-[8rem] truncate">{firstName || 'Profile'}</span> : null}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-sidebar-border/70 bg-sidebar-accent/45 text-destructive hover:text-destructive"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('request-logout'));
            }}
            aria-label={t('header.logout', 'Logout')}
            title={t('header.logout', 'Logout')}
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <aside
          className="shell-sidebar hidden h-screen w-[var(--shell-sidebar-width)] overflow-hidden border-r border-sidebar-border/80 md:fixed md:top-0 md:z-30 md:[inset-inline-start:0] md:block"
          style={{ borderInlineEndWidth: 'var(--shell-sidebar-border-width)' }}
        />
      }
    >
      <SidebarContent />
    </Suspense>
  );
}
