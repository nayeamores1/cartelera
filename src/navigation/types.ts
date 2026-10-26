import type { TipoMedio } from '../types';
import type { NavigatorScreenParams } from '@react-navigation/native';
export type RootStackParamList = {
  Bienvenida: undefined; Login: undefined; Registro: undefined;
  Cartelera: NavigatorScreenParams<TabsParamList> | undefined; Detalle: { tipo: TipoMedio; id: number }; Editar: { itemId: string };
};
export type TabsParamList = { Explorar: undefined; Lista: undefined; Acerca: undefined };
