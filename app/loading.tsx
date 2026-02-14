import { AppLogo } from '@/components/common/app-logo';

export default function Loading() {
  return (
    <div className="splash-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="splash-overlay__glow" />
      <div className="splash-overlay__panel">
        <div className="splash-overlay__ring" />
        <div className="splash-overlay__logo">
          <AppLogo size={72} showText={false} variant="splash" splashSurface={false} className="!m-0" />
        </div>
        <h2 className="splash-overlay__title">SocialFlow Orbit</h2>
        <p className="splash-overlay__subtitle">Loading your workspace...</p>
      </div>
    </div>
  );
}
