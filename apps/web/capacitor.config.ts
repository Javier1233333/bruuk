import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bruuk.app',
  appName: 'Bruuk',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
