import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigationAdapter } from '@bruuk/shared-logic/adapters';
import type { INavigationAdapter, NavigationTarget } from '@bruuk/shared-logic/adapters';

const routeMap: Record<NavigationTarget['screen'], string | ((params?: Record<string, any>) => string)> = {
  home: '/',
  nosotros: '/nosotros',
  login: '/login',
  descubrir: (params) => params?.city ? `/descubrir/${params.city}` : '/descubrir',
  experiences: (params) => params?.city ? `/experiencias/${params.city}` : '/experiencias',
  'profile-username': (params) => `/profile/${params?.username || ''}`,
  setup: '/setup',
  dashboard: '/app',
  chats: '/chats',
  profile: '/perfil',
  verify: '/verify',
  'forgot-password': '/forgot-password',
  'reset-password': '/reset-password',
};

export function NavigationAdapterProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    const adapter: INavigationAdapter = {
      navigate: (target) => {
        const route = routeMap[target.screen];
        const path = typeof route === 'function' ? route(target.params) : route;
        navigate(path);
      },
      goBack: () => {
        navigate(-1);
      },
      replace: (target) => {
        const route = routeMap[target.screen];
        const path = typeof route === 'function' ? route(target.params) : route;
        navigate(path, { replace: true });
      }
    };
    
    setNavigationAdapter(adapter);
  }, [navigate]);

  return <>{children}</>;
}
