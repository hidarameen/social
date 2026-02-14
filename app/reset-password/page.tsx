import ResetPasswordPageClient from './reset-password-page-client';

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(searchParams: PageProps['searchParams'], key: string): string {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0] ?? '';
  if (typeof value === 'string') return value;
  return '';
}

export default function ResetPasswordPage({ searchParams }: PageProps) {
  const token = readParam(searchParams, 'token');
  const email = readParam(searchParams, 'email');
  const code = readParam(searchParams, 'code');
  return <ResetPasswordPageClient token={token} queryEmail={email} queryCode={code} />;
}
