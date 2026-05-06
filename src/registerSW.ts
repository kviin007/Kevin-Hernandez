import { registerSW } from 'virtual:pwa-register';

export const setupPWA = () => {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Prompt will be shown in UI if needed
      if (confirm('Nueva versión disponible. ¿Recargar para actualizar?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('App is ready to work offline.');
    },
  });
};
