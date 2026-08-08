import { Navigate, useLocation, useParams } from 'react-router-dom';

export function LegacyPlanRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/guadalajara/planes/${slug ?? ''}`} replace />;
}

export function LegacyRackRedirect() {
  const location = useLocation();
  return <Navigate to={`/guadalajara/rack${location.search}`} replace />;
}
