import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function PortfolioCollection({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'access' });
  return (
    <main className="design-access">
      <section className="design-access-card">
        <h1>{t('collection')}</h1>
        <a className="design-access-link" href={`/?gallery=1&lang=${locale}`}>{t('gallery')}</a>
      </section>
    </main>
  );
}
