'use client';

import { useEffect, useRef, useState, type ComponentType, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { DesignId } from '@/lib/designs';
import { getSiteData } from '@/lib/portfolio-adapter';
import type { SiteData } from '@/lib/types';
import { DesignDock } from './DesignDock';

type AccessState =
  | { kind: 'loading' }
  | { kind: 'locked'; error?: 'incorrect' | 'signInFailed' }
  | { kind: 'unavailable' }
  | { kind: 'lockFailed' }
  | { kind: 'ready'; data: SiteData };

type Props = {
  Design: ComponentType<{ data: SiteData }>;
  locale: Locale;
  current: DesignId;
};

async function loadDesign(locale: Locale, signal: AbortSignal): Promise<AccessState> {
  const response = await fetch('/api/cv', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (response.status === 401) return { kind: 'locked' };
  if (!response.ok) return { kind: 'unavailable' };
  return { kind: 'ready', data: getSiteData(await response.json(), locale) };
}

export function PrivateDesign({ Design, locale, current }: Props) {
  const t = useTranslations('access');
  const [state, setState] = useState<AccessState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [changingSession, setChangingSession] = useState(false);
  const sessionRequest = useRef<AbortController | null>(null);

  function reload() {
    setState({ kind: 'loading' });
    setAttempt((value) => value + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    loadDesign(locale, controller.signal).then(
      (result) => { if (!controller.signal.aborted) setState(result); },
      () => { if (!controller.signal.aborted) setState({ kind: 'unavailable' }); },
    );
    return () => controller.abort();
  }, [locale, attempt]);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => { if (event.persisted) reload(); };
    window.addEventListener('pageshow', restore);
    return () => {
      window.removeEventListener('pageshow', restore);
      sessionRequest.current?.abort();
    };
  }, []);

  async function changeSession(method: 'POST' | 'DELETE', password?: string) {
    if (sessionRequest.current) return;
    const controller = new AbortController();
    sessionRequest.current = controller;
    setChangingSession(true);
    if (method === 'DELETE') setState({ kind: 'loading' });

    try {
      const response = await fetch('/api/session', {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        ...(method === 'POST' ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        } : {}),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setState(method === 'DELETE'
          ? { kind: 'lockFailed' }
          : { kind: 'locked', error: response.status === 401 ? 'incorrect' : 'signInFailed' });
        return;
      }
      if (method === 'POST') reload();
      else setState({ kind: 'locked' });
    } catch {
      if (!controller.signal.aborted) {
        setState(method === 'DELETE' ? { kind: 'lockFailed' } : { kind: 'locked', error: 'signInFailed' });
      }
    } finally {
      sessionRequest.current = null;
      if (!controller.signal.aborted) setChangingSession(false);
    }
  }

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = new FormData(form).get('password');
    if (typeof password !== 'string' || !password) return;
    form.reset();
    void changeSession('POST', password);
  }

  if (state.kind === 'ready' && state.data.locale === locale) {
    return (
      <>
        <Design data={state.data} />
        <DesignDock current={current} onLock={() => void changeSession('DELETE')} />
      </>
    );
  }

  return (
    <main className="design-access">
      <section className="design-access-card" aria-labelledby="design-access-title">
        <h1 id="design-access-title">{t('title')}</h1>
        {state.kind === 'locked' ? (
          <form onSubmit={signIn} className="design-access-form">
            <label htmlFor="design-access-password">{t('password')}</label>
            <input id="design-access-password" name="password" type="password" autoComplete="current-password" maxLength={512} required />
            {state.error && <p role="alert">{t(state.error)}</p>}
            <button type="submit" disabled={changingSession}>{t('enter')}</button>
          </form>
        ) : state.kind === 'unavailable' ? (
          <>
            <p role="alert">{t('unavailable')}</p>
            <button type="button" onClick={reload}>{t('retry')}</button>
          </>
        ) : state.kind === 'lockFailed' ? (
          <>
            <p role="alert">{t('lockFailed')}</p>
            <button type="button" onClick={() => void changeSession('DELETE')}>{t('retry')}</button>
          </>
        ) : <p role="status">{t('loading')}</p>}
        <a className="design-access-link" href={`/?gallery=1&lang=${locale}`}>{t('gallery')}</a>
      </section>
    </main>
  );
}
