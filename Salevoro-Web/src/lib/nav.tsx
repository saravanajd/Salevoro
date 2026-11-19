import React from 'react';

type AppRouter = { navigate: (to: string, opts?: { replace?: boolean }) => unknown };
let appRouter: AppRouter | null = null;
export function setRouter(r: AppRouter) { appRouter = r; }

/** Navigate from anywhere (class components, lifecycle methods, handlers). */
export function scGo(path: string, replace = false) {
  if (!appRouter) { window.location.assign(path); return; }
  queueMicrotask(() => appRouter!.navigate(path, { replace }));
}

/** Maps legacy page links ("Billing.dc.html", "App.dc.html#billing") to routes. */
export function toRoute(href?: string | null): string | null {
  if (!href) return null;
  const m = /^(?:\.\/)?([A-Za-z]+)\.dc\.html(?:#([\w-]*))?$/.exec(href);
  if (!m) return href.startsWith('/') ? href : null;
  const base = m[1].toLowerCase();
  return base === 'app' ? '/' + (m[2] || '') : '/' + base;
}

/** The scrolling content area of the app shell. */
export function scMain(): HTMLElement {
  return document.getElementById('sc-main') || (document.scrollingElement as HTMLElement) || document.body;
}

/** Anchor that routes internal links client-side. */
export function A({ href, onClick, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const to = toRoute(href);
  return (
    <a
      {...rest}
      href={to ?? href}
      onClick={e => {
        onClick?.(e);
        if (e.defaultPrevented || !to || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        scGo(to);
      }}
    />
  );
}
