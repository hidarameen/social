import VerifyEmailPageClient from './verify-email-page-client';

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(searchParams: PageProps['searchParams'], key: string): string {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0] ?? '';
  if (typeof value === 'string') return value;
  return '';
}

export default function VerifyEmailPage({ searchParams }: PageProps) {
  const token = readParam(searchParams, 'token');
  const email = readParam(searchParams, 'email');
  const code = readParam(searchParams, 'code');
  return <VerifyEmailPageClient token={token} queryEmail={email} queryCode={code} />;
}
