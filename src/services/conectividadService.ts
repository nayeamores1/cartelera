import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
export type Conexion = 'sin-comprobar' | 'conectado' | 'sin-conexion';
export const conectividadService = {
  observar: (callback: (estado: Conexion) => void) => {
    let activo = true;
    const cancelar = NetInfo.addEventListener(state => { if (activo) callback(state.isConnected === false || state.isInternetReachable === false ? 'sin-conexion' : state.isConnected === true && state.isInternetReachable === true ? 'conectado' : 'sin-comprobar'); });
    const appState = AppState.addEventListener('change', state => { if (state === 'active') void NetInfo.refresh().catch(() => { if (activo) callback('sin-comprobar'); }); });
    return () => { activo = false; cancelar(); appState.remove(); };
  },
};
