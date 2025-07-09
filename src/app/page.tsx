import { SnapStampClient } from '@/components/snap-stamp-client';
import { SnapStampLogo } from '@/components/icons';

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <header className="p-4 border-b bg-card">
        <div className="container mx-auto flex items-center gap-2">
          <SnapStampLogo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight font-headline">
            SnapStamp
          </h1>
        </div>
      </header>
      <main className="p-4 md:p-8">
        <div className="container mx-auto">
          <SnapStampClient />
        </div>
      </main>
    </div>
  );
}
