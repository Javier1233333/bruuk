import { OceanLanding } from '../../components/OceanLanding';

// Wrapper delgado que monta OceanLanding en modo fullscreen.
// El AppShell detecta tab === 'mar' y agrega la clase
// app-shell--mar-fullscreen que oculta header y tabbar.
// onBack regresa a la pestaña de planes en vez de navigate(-1),
// para no sacar al usuario de /app.
export function MarTab({ onBack }: { onBack: () => void }) {
  return <OceanLanding onBack={onBack} />;
}
