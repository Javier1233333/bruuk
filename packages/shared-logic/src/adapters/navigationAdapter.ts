export interface NavigationTarget {
  screen: 'home' | 'nosotros' | 'login' | 'descubrir' | 'experiences' | 'profile-username' | 'setup' | 'dashboard' | 'chats' | 'profile' | 'verify' | 'forgot-password' | 'reset-password';
  params?: Record<string, any>;
}

export interface INavigationAdapter {
  navigate(target: NavigationTarget): void;
  goBack(): void;
  replace(target: NavigationTarget): void;
}

export let navigationAdapter: INavigationAdapter;

export function setNavigationAdapter(adapter: INavigationAdapter) {
  navigationAdapter = adapter;
}

export function useNavigation() {
  return {
    navigate: (screen: NavigationTarget['screen'], params?: Record<string, any>) => {
      if (!navigationAdapter) {
        console.warn('[NavigationAdapter] navigationAdapter not registered yet!');
        return;
      }
      navigationAdapter.navigate({ screen, params });
    },
    goBack: () => {
      if (!navigationAdapter) {
        console.warn('[NavigationAdapter] navigationAdapter not registered yet!');
        return;
      }
      navigationAdapter.goBack();
    },
    replace: (screen: NavigationTarget['screen'], params?: Record<string, any>) => {
      if (!navigationAdapter) {
        console.warn('[NavigationAdapter] navigationAdapter not registered yet!');
        return;
      }
      navigationAdapter.replace({ screen, params });
    }
  };
}
