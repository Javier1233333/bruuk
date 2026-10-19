import { PlaceList } from '../../components/PlaceList';
import type { PlanInterest } from '../../lib/catalog';

const INTERESTS: PlanInterest[] = ['cafe', 'comida', 'noche'];

export default function ComerScreen() {
  return (
    <PlaceList
      kicker="/ SPOTS · GDL"
      title="Comer y"
      accent="tomar."
      intro="Cafés, comida, bares y rincones elegidos para encontrar un plan sin perderte en el feed."
      interests={INTERESTS}
    />
  );
}
