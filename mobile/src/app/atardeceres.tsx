import { Sunset } from 'lucide-react-native';
import { SpotCard } from '../components/SpotCard';
import { Body, Screen, Title } from '../components/ui';
import { useContent } from '../lib/content';
import { colors } from '../theme';

export default function SunsetScreen() {
  const { sunsets, byId, refresh, refreshing } = useContent();
  // En el orden de la lista: es una selección, no va al azar.
  const places = sunsets.map((id) => byId.get(id)).filter((place) => place !== undefined);
  return (
    <Screen onRefresh={() => void refresh()} refreshing={refreshing}>
      <Sunset size={30} color={colors.sunset} />
      <Title accent="EL SOL.">Donde cae</Title>
      <Body>Miradores, parques y rooftops para ver el atardecer en Guadalajara y Zapopan. Llega unos minutos antes.</Body>
      {places.map((place) => <SpotCard key={place.id} place={place} />)}
    </Screen>
  );
}
