import { StyleSheet } from 'react-native';
import {
  accesibilidad,
  colores as c,
  espacios as e,
  radios as r,
  tipografia as t,
} from './index';

export const estilosResumen = StyleSheet.create({
  titulo: {
    color: c.texto,
    fontSize: t.tituloTelefono.tamano,
    fontWeight: t.tituloTelefono.peso,
  },
  marca: {
    color: c.acento,
    fontSize: t.wordmark.tamanoTelefono,
    fontWeight: '800',
  },
  seccion: {
    color: c.texto,
    fontSize: t.seccion.tamano,
    lineHeight: t.seccion.interlinea,
    fontWeight: t.seccion.peso,
  },
  cuerpo: {
    color: c.texto,
    fontSize: t.cuerpo.tamano,
    lineHeight: t.cuerpo.interlinea,
  },
  secundario: {
    color: c.secundario,
    fontSize: t.etiqueta.tamano,
    lineHeight: t.etiqueta.interlinea,
  },
  auxiliar: {
    color: c.secundario,
    fontSize: t.auxiliar.tamano,
    lineHeight: t.auxiliar.interlinea,
  },
  total: {
    color: c.acento,
    fontSize: t.totalProtagonista.tamano,
    lineHeight: t.totalProtagonista.interlinea,
    fontWeight: t.totalProtagonista.peso,
    fontVariant: ['tabular-nums'],
  },
  // 750 sigue como referencia; no asignar fontWeight hasta aprobar su adaptación.
  valor: {
    color: c.texto,
    fontSize: t.datoTarjeta.tamano,
    lineHeight: t.datoTarjeta.interlinea,
  },
  tarjeta: {
    backgroundColor: c.superficie,
    borderColor: c.borde,
    borderWidth: 1,
    borderRadius: r['radio-tarjeta'],
    padding: e['esp-4'],
    gap: e['esp-2'],
  },
  grupo: { gap: e['esp-4'] },
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: e['esp-3'],
    alignItems: 'center',
  },
  selector: {
    minHeight: accesibilidad.tactil,
    minWidth: accesibilidad.tactil,
    padding: e['esp-3'],
    backgroundColor: c.superficie,
    borderWidth: 1,
    borderColor: c.acento,
    borderRadius: r['radio-control'],
    justifyContent: 'center',
  },
  seleccionado: { borderColor: c.acento, borderWidth: 2 },
  modal: {
    flex: 1,
    backgroundColor: c.fondo,
    padding: e['esp-5'],
    gap: e['esp-4'],
  },
  opciones: { gap: e['esp-3'], paddingBottom: e['esp-5'] },
  grafica: {
    flexDirection: 'row',
    gap: e['esp-1'],
    flexGrow: 1,
    alignItems: 'flex-end',
  },
  mes: {
    minWidth: e['esp-5'],
    flexGrow: 1,
    alignItems: 'center',
    gap: e['esp-2'],
  },
  pista: {
    height: 100,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barra: {
    backgroundColor: c.acento,
    width: '100%',
    maxWidth: r['radio-poster'],
    borderTopLeftRadius: e['esp-1'],
    borderTopRightRadius: e['esp-1'],
  },
  poster: { flex: 1 },
  detalleObra: { flex: 2, gap: e['esp-2'] },
  destacada: { flexDirection: 'row', gap: e['esp-4'], alignItems: 'center' },
  aviso: { borderLeftColor: c.acento, borderLeftWidth: 3 },
  error: { borderLeftColor: c.error },
});
