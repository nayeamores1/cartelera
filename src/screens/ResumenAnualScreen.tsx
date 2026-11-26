import { useCallback } from 'react';
import { Text, View } from 'react-native';
import {
  useFocusEffect,
  type CompositeScreenProps,
} from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabsParamList } from '../navigation/types';
import { useCartelera } from '../context/CarteleraContext';
import { Button, Page } from '../components/UI';
import {
  BarrasMensuales,
  EstadoResumen,
  meses,
  ObraDestacada,
  SelectorAnio,
  TarjetaDato,
} from '../components/resumen/Resumen';
import { estilosResumen as s } from '../tema/estilosResumen';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, 'Resumen'>,
  NativeStackScreenProps<RootStackParamList, 'Cartelera'>
>;
export function ResumenAnualScreen({ navigation }: Props) {
  const { resumen } = useCartelera();
  const { abrir, cerrar, seleccionar, reintentar, estado } = resumen;
  useFocusEffect(
    useCallback(() => {
      abrir();
      return cerrar;
    }, [abrir, cerrar]),
  );
  const { peticion, puntoPendiente } = estado;
  const datos = peticion.estado === 'exito' ? peticion.datos : null;
  const irLista = () => navigation.navigate('Lista');
  return (
    <Page>
      <Text style={s.marca}>Mi Cartelera</Text>
      <Text style={s.titulo} accessibilityRole="header">
        Mi año en cine
      </Text>
      <Text style={s.secundario}>Tus historias, a tu ritmo.</Text>
      <SelectorAnio
        anio={estado.anio}
        anios={estado.anios}
        seleccionar={seleccionar}
      />
      {estado.conexion === 'sin-conexion' ? (
        <View style={[s.tarjeta, s.aviso]}>
          <Text style={s.cuerpo}>
            {estado.ultimaCopia
              ? 'Sin conexión. Estás viendo tu última copia guardada'
              : 'Sin conexión.'}
          </Text>
          {estado.ultimaCopia ? (
            <Text style={s.auxiliar}>
              Última copia:{' '}
              {new Date(estado.ultimaCopia).toLocaleString('es-ES')}
            </Text>
          ) : null}
        </View>
      ) : null}
      {peticion.estado === 'inicial' || peticion.estado === 'cargando' ? (
        <EstadoResumen
          titulo="Estamos preparando tu año en cine"
          mensaje="Reunimos tus historias para este año."
          cargando
          progreso={estado.progreso}
        />
      ) : null}
      {peticion.estado === 'error' ? (
        <>
          <EstadoResumen
            titulo={
              puntoPendiente
                ? 'Este escenario está pendiente'
                : 'No pudimos cargar tu resumen'
            }
            mensaje={peticion.mensaje}
          />
          {puntoPendiente ? (
            <Button title="Ir a Mi lista" secondary onPress={irLista} />
          ) : (
            <Button
              title="Reintentar"
              disabled={estado.conexion !== 'conectado'}
              onPress={() => {
                void reintentar();
              }}
            />
          )}
        </>
      ) : null}
      {datos?.totalObras === 0 ? (
        <>
          <EstadoResumen
            titulo="Todavía no tienes obras vistas este año"
            mensaje="Tu próxima historia puede empezar en Mi lista."
          />
          <Button title="Ir a Mi lista" onPress={irLista} />
        </>
      ) : null}
      {datos && datos.totalObras > 0 ? (
        <>
          <View style={s.tarjeta}>
            <Text style={s.secundario}>Tu año en historias</Text>
            <Text style={s.total}>{datos.totalObras}</Text>
            <Text style={s.cuerpo}>obras vistas</Text>
            <Text style={s.secundario}>
              {datos.peliculas} películas · {datos.series} series
            </Text>
          </View>
          {datos.obrasSinDatos > 0 ? (
            <EstadoResumen
              titulo="Algunas historias siguen sin datos"
              mensaje={`${datos.obrasSinDatos} obras siguen sin datos. El total sí las incluye.`}
            />
          ) : null}
          <TarjetaDato
            titulo="Horas de cine · películas"
            valor={`${datos.horas.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`}
            nota={
              datos.peliculasSinDuracion
                ? `${datos.peliculasSinDuracion} películas sin duración disponible`
                : 'Las series no suman horas de cine.'
            }
          />
          <TarjetaDato
            titulo="Género más visto"
            valor={datos.generoTop?.nombre ?? 'Sin datos suficientes'}
            nota={
              datos.generoTop ? `${datos.generoTop.obras} obras` : undefined
            }
          />
          <TarjetaDato
            titulo="Director más visto · películas"
            valor={
              datos.directorTop?.nombre ?? 'Sin datos suficientes de directores'
            }
            nota={
              datos.directorTop
                ? `${datos.directorTop.obras} películas`
                : undefined
            }
          />
          <TarjetaDato
            titulo="Tu mes más activo"
            valor={
              datos.mesTop === null ? 'Sin actividad' : meses[datos.mesTop]
            }
          />
          <BarrasMensuales valores={datos.obrasPorMes} />
          <ObraDestacada
            obra={datos.destacada}
            poster={estado.poster}
            irLista={irLista}
            verDetalle={() => {
              if (datos.destacada)
                navigation.navigate('Detalle', {
                  tipo: datos.destacada.tipo,
                  id: datos.destacada.tmdbId,
                });
            }}
          />
        </>
      ) : null}
    </Page>
  );
}
