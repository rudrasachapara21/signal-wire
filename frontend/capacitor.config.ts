import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.signalwire.app',
  appName: 'Signal Wire',
  webDir: '.output/public',
  server: {
    url: 'https://signal-wire-frontend.onrender.com',
    cleartext: true,
  },
};

export default config;
