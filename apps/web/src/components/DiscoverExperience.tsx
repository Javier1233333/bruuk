import { useSyncExternalStore } from 'react';
import { AppShell } from './AppShell';
import { OceanLanding } from './OceanLanding';
import './DiscoverExperience.css';

export type DiscoverExperienceProps =
  | { mode: 'standalone' }
  | {
      mode: 'embedded';
      activated: boolean;
      onContinue: () => void;
    };

const MOBILE_QUERY = '(max-width: 768px)';

function subscribeToMobileQuery(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerMobileSnapshot() {
  return false;
}

export function DiscoverExperience(props: DiscoverExperienceProps) {
  const isMobile = useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    getServerMobileSnapshot
  );

  if (props.mode === 'standalone') {
    return (
      <AppShell>
        <OceanLanding mode="standalone" />
      </AppShell>
    );
  }

  const interactionLocked = isMobile && !props.activated;

  return (
    <div
      className="discover-experience discover-experience--embedded"
      data-demo-activated={props.activated ? 'true' : 'false'}
    >
      <div
        className="discover-experience__surface"
        inert={interactionLocked ? true : undefined}
        aria-hidden={interactionLocked ? true : undefined}
      >
        <OceanLanding mode="embedded" />
      </div>
    </div>
  );
}
