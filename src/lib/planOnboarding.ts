// Si ya se vio el onboarding de "Arma tu plan" (src/components/PlanOnboarding.tsx).
const STORAGE_KEY = 'bruuk:plan-onboarding';

export function hasSeenPlanOnboarding() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export const markPlanOnboardingSeen = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch { /* sin almacenamiento: se vuelve a mostrar la próxima vez */ }
};
