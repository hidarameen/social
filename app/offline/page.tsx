import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Offline | SocialFlow',
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-card/70">
            <WifiOff size={24} className="text-muted-foreground" />
          </div>
          <CardTitle>You are offline</CardTitle>
          <CardDescription>
            SocialFlow cannot reach the network right now. Reconnect and try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Link href="/" className="flex-1">
            <Button className="w-full">Retry</Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
