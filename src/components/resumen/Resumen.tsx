import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../UI';
import { ImagenCatalogo } from '../ImagenCatalogo';
import { colores } from '../../tema';
import { estilosResumen as s } from '../../tema/estilosResumen';
import type { EntradaResumen } from '../../dominio/resumenAnual';
import type { ProgresoResumen } from '../../services/prepararResumen';

export const meses = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export function SelectorAnio({
  anio,
  anios,
  seleccionar,
}: {
  anio: number;
  anios: readonly number[];
  seleccionar: (anio: number) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={s.grupo}>
      <Text style={s.secundario}>Año de visionado</Text>
      <Pressable
        style={s.selector}
        accessibilityRole="button"
        accessibilityLabel={`Cambiar año. Año seleccionado ${anio}`}
        accessibilityState={{ disabled: !anios.length, expanded: abierto }}
        disabled={!anios.length}
        onPress={() => setAbierto(true)}
      >
        <Text style={s.cuerpo}>{anio} ▾</Text>
      </Pressable>
      <Modal
        visible={abierto}
        animationType="slide"
        onRequestClose={() => setAbierto(false)}
      >
        <SafeAreaView style={s.modal} accessibilityViewIsModal>
          <Text style={s.seccion} accessibilityRole="header">
            Elige un año
          </Text>
          <ScrollView contentContainerStyle={s.opciones}>
            {anios.map((valor) => (
              <Pressable
                key={valor}
                style={[s.selector, valor === anio && s.seleccionado]}
                accessibilityRole="radio"
                accessibilityState={{ selected: valor === anio }}
                accessibilityLabel={`Año ${valor}`}
                onPress={() => {
                  setAbierto(false);
                  seleccionar(valor);
                }}
              >
                <Text style={s.cuerpo}>{valor}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button
            title="Cerrar selector"
            secondary
            onPress={() => setAbierto(false)}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export function TarjetaDato({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor: string;
  nota?: string;
}) {
  return (
    <View style={s.tarjeta}>
      <Text style={s.secundario}>{titulo}</Text>
      <Text style={s.valor}>{valor}</Text>
      {nota ? <Text style={s.auxiliar}>{nota}</Text> : null}
    </View>
  );
}

export function BarrasMensuales({ valores }: { valores: readonly number[] }) {
  const maximo = Math.max(1, ...valores);
  return (
    <View style={s.tarjeta}>
      <Text style={s.seccion} accessibilityRole="header">
        Tus doce meses
      </Text>
      <Text style={s.secundario}>Obras vistas en cada mes</Text>
      <ScrollView horizontal contentContainerStyle={s.grafica}>
        {meses.map((mes, index) => (
          <View
            key={mes}
            style={s.mes}
            accessible
            accessibilityLabel={`${mes}: ${valores[index]} obras vistas`}
          >
            <Text style={s.cuerpo}>{valores[index]}</Text>
            <View style={s.pista} accessible={false}>
              <View
                style={[s.barra, { height: (valores[index] / maximo) * 100 }]}
              />
            </View>
            <Text style={s.auxiliar}>{mes}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function ObraDestacada({
  obra,
  poster,
  verDetalle,
  irLista,
}: {
  obra: EntradaResumen | null;
  poster: string | null;
  verDetalle: () => void;
  irLista: () => void;
}) {
  return (
    <View style={s.tarjeta}>
      <Text style={s.seccion} accessibilityRole="header">
        Una historia para recordar
      </Text>
      {obra ? (
        <>
          <View style={s.destacada}>
            <ImagenCatalogo
              uri={poster}
              label={`Póster de ${obra.titulo}`}
              style={s.poster}
            />
            <View style={s.detalleObra}>
              <Text style={s.cuerpo}>{obra.titulo}</Text>
              <Text style={s.secundario}>
                {obra.tipo === 'movie' ? 'Película' : 'Serie'} ·{' '}
                {obra.anio || 'Sin fecha de estreno'}
              </Text>
              <Text style={s.cuerpo}>
                Tu calificación: {obra.calificacionPersonal} / 5
              </Text>
            </View>
          </View>
          <Button title="Ver esta obra" secondary onPress={verDetalle} />
        </>
      ) : (
        <>
          <Text style={s.cuerpo}>
            Califica una obra vista para descubrir tu destacada.
          </Text>
          <Button
            title="Ir a Mi lista para calificar"
            secondary
            onPress={irLista}
          />
        </>
      )}
    </View>
  );
}

export function EstadoResumen({
  titulo,
  mensaje,
  cargando = false,
  progreso,
}: {
  titulo: string;
  mensaje: string;
  cargando?: boolean;
  progreso?: ProgresoResumen | null;
}) {
  return (
    <View style={[s.tarjeta, s.aviso]} accessibilityLiveRegion="polite">
      {cargando ? (
        <ActivityIndicator
          color={colores.acento}
          accessibilityLabel="Preparando resumen"
        />
      ) : null}
      <Text style={s.seccion} accessibilityRole="header">
        {titulo}
      </Text>
      <Text style={s.cuerpo}>{mensaje}</Text>
      {progreso ? (
        <Text style={s.secundario}>
          {progreso.fase === 'fechas'
            ? 'Registrando fechas anteriores'
            : 'Completando datos'}
          : {progreso.procesadas} de {progreso.total}
        </Text>
      ) : null}
    </View>
  );
}
