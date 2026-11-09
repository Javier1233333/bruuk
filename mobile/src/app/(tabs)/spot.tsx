import { Redirect } from 'expo-router';

// El botón "+" de la barra abre /sube-un-spot directo; esta ruta sólo existe para la pestaña.
export default function SpotTab() {
  return <Redirect href="/sube-un-spot" />;
}
