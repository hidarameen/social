import { Suspense } from 'react';
import ResetPasswordPageClient from './reset-password-page-client';

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto mt-16 max-w-xl space-y-3 rounded-2xl border border-border/60 bg-card/70 p-6">
        <div className="h-10 rounded-md bg-muted/40" />
        <div className="h-10 rounded-md bg-muted/40" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
