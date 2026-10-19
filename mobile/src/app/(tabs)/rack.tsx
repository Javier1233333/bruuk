import { PlaceList } from '../../components/PlaceList';
import type { PlanInterest } from '../../lib/catalog';

const INTERESTS: PlanInterest[] = ['vintage', 'cultura'];

export default function RackScreen() {
  return (
    <PlaceList
      kicker="/ RACK · GDL"
      title="Vintage y"
      accent="cultura."
      intro="Moda, tianguis, vinilos, antigüedades, museos y espacios con historia propia."
      interests={INTERESTS}
    />
  );
}
