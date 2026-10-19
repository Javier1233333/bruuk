import { Body, Kicker, PlaceCard, Screen, Title } from '../components/ui';
import { placesFor } from '../lib/catalog';

const SUNSETS = placesFor(['atardecer']);

export default function SunsetScreen() {
  return (
    <Screen>
      <Kicker>/ ATARDECERES · GDL</Kicker>
      <Title accent="sol.">Ver caer el</Title>
      <Body>Miradores y puntos para ver el atardecer en Guadalajara y Zapopan. Llega unos minutos antes.</Body>
      {SUNSETS.map((place) => <PlaceCard key={place.id} place={place} />)}
    </Screen>
  );
}
