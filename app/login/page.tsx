import LoginPageClient from './login-page-client';

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(
  searchParams: PageProps['searchParams'],
  key: string
): string {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0] ?? '';
  if (typeof value === 'string') return value;
  return '';
}

export default function LoginPage({ searchParams }: PageProps) {
  const rawCallback = readParam(searchParams, 'callbackUrl');
  const callbackUrl = rawCallback.startsWith('/') ? rawCallback : '/';
  const email = readParam(searchParams, 'email');
  const verified = readParam(searchParams, 'verified') === '1';
  const reset = readParam(searchParams, 'reset') === '1';
  const registered = readParam(searchParams, 'registered') === '1';

  return (
    <LoginPageClient
      callbackUrl={callbackUrl || '/'}
      queryEmail={email}
      verified={verified}
      reset={reset}
      registered={registered}
    />
  );
}
