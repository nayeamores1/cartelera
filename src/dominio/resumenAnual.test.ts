import { describe, expect, it } from 'vitest';
import { aniosDisponibles, resumenAnual } from './resumenAnual';
import {
  FECHAS,
  obra,
  obraConDatosAusentes,
} from './fixtures/resumenAnual.fixtures';

// Paso 12: importación real deliberada. resumenAnual.ts aún no existe.
// No hay mocks, stubs ni implementación alternativa que oculte su ausencia.
// PA-01–PA-06 NO se resuelven aquí: sin empate completo de destacada,
// fechas Vista inválidas, política de reintento, clasificación automática de
// vacíos/null, convenciones lingüísticas o mensaje offline sin copia.

describe('aniosDisponibles — D3/D4', () => {
  it('CA-A3-01 / V14: incluye el año actual aunque no haya obras', () => {
    expect(aniosDisponibles([], 2032)).toEqual([2032]);
  });

  it('CA-A3-01 / V14: años únicos descendentes más actual, sin años vacíos intermedios', () => {
    const items = [
      obra({ id: 1, fecha: FECHAS.anterior }),
      obra({ id: 2 }),
      obra({ id: 3 }),
    ];
    expect(aniosDisponibles(items, 2027)).toEqual([2027, 2026, 2024]);
  });

  it('CA-A3-01 / V14: no duplica actual ni presupone que todos los años sean anteriores', () => {
    expect(aniosDisponibles([obra({ id: 1 }), obra({ id: 2 })], 2026)).toEqual([
      2026,
    ]);
    expect(
      aniosDisponibles(
        [obra({ id: 1 }), obra({ id: 2, fecha: FECHAS.anterior })],
        2025,
      ),
    ).toEqual([2026, 2025, 2024]);
  });

  it('CA-A3-01 / V14: una obra Por ver o Viendo no aporta un año de visionado', () => {
    expect(
      aniosDisponibles(
        [obra({ id: 1, estado: 'por_ver' }), obra({ id: 2, estado: 'viendo' })],
        2030,
      ),
    ).toEqual([2030]);
  });

  it('CA-A2-02 / V06: usa el año local proyectado, no el año UTC de vistaEn', () => {
    expect(
      aniosDisponibles([obra({ id: 1, fecha: FECHAS.limiteLocal })], 2026),
    ).toEqual([2026, 2025]);
    expect(
      aniosDisponibles([obra({ id: 1, fecha: FECHAS.limiteUtc })], 2026),
    ).toEqual([2026]);
  });
});

describe('resumenAnual — selección y tiempo local D3/D4', () => {
  it('CA-A2-01 / V05: filtra Vista del año elegido y desglosa películas y series', () => {
    const items = [
      obra({ id: 1 }),
      obra({ id: 2, tipo: 'tv' }),
      obra({ id: 3, estado: 'por_ver' }),
      obra({ id: 4, estado: 'viendo' }),
      obra({ id: 5, fecha: FECHAS.anterior }),
    ];
    expect(resumenAnual(items, 2026)).toMatchObject({
      anio: 2026,
      totalObras: 2,
      peliculas: 1,
      series: 1,
    });
  });

  it('CA-A2-01 / V05: una obra repetida cuenta una vez y el mismo ID de otro tipo es otra obra', () => {
    const movie = obra({ id: 1 });
    expect(
      resumenAnual(
        [movie, structuredClone(movie), obra({ id: 1, tipo: 'tv' })],
        2026,
      ),
    ).toMatchObject({ totalObras: 2, peliculas: 1, series: 1 });
  });

  it('CA-A2-02 / V06: un instante UTC de enero cuenta en diciembre del año local anterior', () => {
    const item = obra({ id: 1, fecha: FECHAS.limiteLocal });
    const result = resumenAnual([item], 2025);
    expect(result.totalObras).toBe(1);
    expect(result.obrasPorMes).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(result.mesTop).toBe(11);
    expect(resumenAnual([item], 2026).totalObras).toBe(0);
  });

  it('CA-A2-02 / V06: el mismo instante con proyección UTC pertenece a enero de 2026', () => {
    const result = resumenAnual(
      [obra({ id: 1, fecha: FECHAS.limiteUtc })],
      2026,
    );
    expect(result.obrasPorMes).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('CA-A3-02 / V15, parte pura: elegir otro año cambia los totales sin usar estreno o alta', () => {
    const items = [
      obra({ id: 1 }),
      obra({ id: 2, tipo: 'tv', fecha: FECHAS.anterior }),
    ];
    expect(resumenAnual(items, 2026)).toMatchObject({
      totalObras: 1,
      peliculas: 1,
      series: 0,
    });
    expect(resumenAnual(items, 2024)).toMatchObject({
      totalObras: 1,
      peliculas: 0,
      series: 1,
    });
    expect(resumenAnual(items, 1999).totalObras).toBe(0);
  });
});

describe('resumenAnual — datos presentes/ausentes D5/D6 y horas D7', () => {
  it('CA-A2-03 / V07: suma 120+30 minutos de películas como 2,5 horas y no suma series', () => {
    const result = resumenAnual(
      [
        obra({ id: 1, duracionMin: 120 }),
        obra({ id: 2, duracionMin: 30 }),
        obra({ id: 3, tipo: 'tv' }),
      ],
      2026,
    );
    expect(result).toMatchObject({
      totalObras: 3,
      peliculas: 2,
      series: 1,
      horas: 2.5,
      peliculasSinDuracion: 0,
    });
  });

  it('CA-A2-03 / V07: expresa horas con un decimal', () => {
    expect(resumenAnual([obra({ id: 1, duracionMin: 100 })], 2026).horas).toBe(
      1.7,
    );
  });

  it('CA-A2-03 y CA-A5-05 / V07/V24: duración null explícitamente válida no suma ni implica fallo TMDB', () => {
    const result = resumenAnual(
      [
        obra({ id: 1, duracionMin: null, estadoMetadatos: 'completos' }),
        obra({ id: 2, tipo: 'tv' }),
      ],
      2026,
    );
    expect(result).toMatchObject({
      totalObras: 2,
      horas: 0,
      peliculasSinDuracion: 1,
      obrasSinDatos: 0,
    });
  });

  it('CA-A4-04 / V19, parte pura: fallo explícito mantiene total pero no aporta horas, género o director', () => {
    const items = [
      obra({
        id: 1,
        estadoMetadatos: 'fallo',
        generos: ['Fantasia'],
        directores: ['Bruno'],
        duracionMin: 300,
      }),
      obra({ id: 2, generos: ['Drama'], directores: ['Ana'], duracionMin: 60 }),
    ];
    const result = resumenAnual(items, 2026);
    expect(result).toMatchObject({
      totalObras: 2,
      peliculas: 2,
      obrasSinDatos: 1,
      horas: 1,
      generoTop: { nombre: 'Drama', obras: 1 },
      directorTop: { nombre: 'Ana', obras: 1 },
    });
  });

  it('CA-A4-04 y CA-A5-05 / V19/V24: ausencia de campos con fallo conocido cuenta sin inventar metadatos', () => {
    const result = resumenAnual(
      [obraConDatosAusentes(1, 'movie'), obraConDatosAusentes(2, 'tv')],
      2026,
    );
    expect(result).toMatchObject({
      totalObras: 2,
      peliculas: 1,
      series: 1,
      obrasSinDatos: 2,
      peliculasSinDuracion: 1,
      horas: 0,
      generoTop: null,
      directorTop: null,
    });
  });

  it('CA-A5-05 / V24: los fallos de otro año no contaminan el conteo sin datos del seleccionado', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, fecha: FECHAS.anterior, estadoMetadatos: 'fallo' }),
          obra({ id: 2 }),
        ],
        2026,
      ).obrasSinDatos,
    ).toBe(0);
  });
});

describe('resumenAnual — género D8', () => {
  it('CA-A2-04 / V08: cada obra aporta a todos sus géneros, incluidas series', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, generos: ['Aventura', 'Drama'] }),
          obra({ id: 2, tipo: 'tv', generos: ['Drama'] }),
        ],
        2026,
      ).generoTop,
    ).toEqual({ nombre: 'Drama', obras: 2 });
  });

  it('CA-A2-05 / V09: más obras gana antes que mayor promedio', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, generos: ['Drama'], calificacion: 1 }),
          obra({ id: 2, generos: ['Drama'], calificacion: 1 }),
          obra({ id: 3, generos: ['Aventura'], calificacion: 5 }),
        ],
        2026,
      ).generoTop,
    ).toEqual({ nombre: 'Drama', obras: 2 });
  });

  it('CA-A2-05 / V09: empate de obras se decide por promedio sin tratar null como cero', () => {
    const items = [
      obra({ id: 1, generos: ['Drama'], calificacion: 5 }),
      obra({ id: 2, generos: ['Drama'] }),
      obra({ id: 3, generos: ['Aventura'], calificacion: 4 }),
      obra({ id: 4, generos: ['Aventura'], calificacion: 4 }),
    ];
    expect(resumenAnual(items, 2026).generoTop).toEqual({
      nombre: 'Drama',
      obras: 2,
    });
  });

  it('CA-A2-05 / V09: sin calificadas pierde frente a un género con calificación', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, generos: ['Aventura'] }),
          obra({ id: 2, generos: ['Drama'], calificacion: 1 }),
        ],
        2026,
      ).generoTop,
    ).toEqual({ nombre: 'Drama', obras: 1 });
  });

  it('CA-A2-05 / V09: si persiste empate, orden alfabético inequívoco sin resolver PA-05', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, generos: ['Drama'], calificacion: 4 }),
          obra({ id: 2, generos: ['Aventura'], calificacion: 4 }),
        ],
        2026,
      ).generoTop,
    ).toEqual({ nombre: 'Aventura', obras: 1 });
  });

  it('CA-A2-05 / V09: ambos géneros sin calificadas mantienen el desempate alfabético', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, generos: ['Drama'] }),
          obra({ id: 2, generos: ['Aventura'] }),
        ],
        2026,
      ).generoTop,
    ).toEqual({ nombre: 'Aventura', obras: 1 });
  });
});

describe('resumenAnual — director D9', () => {
  it('CA-A2-06 / V10: una película aporta a cada codirector', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, directores: ['Ana', 'Bruno'] }),
          obra({ id: 2, directores: ['Bruno'] }),
        ],
        2026,
      ).directorTop,
    ).toEqual({ nombre: 'Bruno', obras: 2 });
  });

  it('CA-A2-06 / V10: series no generan director más visto', () => {
    expect(
      resumenAnual(
        [obra({ id: 1, tipo: 'tv' }), obra({ id: 2, tipo: 'tv' })],
        2026,
      ).directorTop,
    ).toBeNull();
  });

  it('CA-A2-06 / V10: más películas prima sobre mayor promedio', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, directores: ['Bruno'], calificacion: 1 }),
          obra({ id: 2, directores: ['Bruno'], calificacion: 1 }),
          obra({ id: 3, directores: ['Ana'], calificacion: 5 }),
        ],
        2026,
      ).directorTop,
    ).toEqual({ nombre: 'Bruno', obras: 2 });
  });

  it('CA-A2-06 / V10: desempata por promedio solo de películas calificadas', () => {
    const items = [
      obra({ id: 1, directores: ['Bruno'], calificacion: 5 }),
      obra({ id: 2, directores: ['Bruno'] }),
      obra({ id: 3, directores: ['Ana'], calificacion: 4 }),
      obra({ id: 4, directores: ['Ana'], calificacion: 4 }),
    ];
    expect(resumenAnual(items, 2026).directorTop).toEqual({
      nombre: 'Bruno',
      obras: 2,
    });
  });

  it('CA-A2-06 / V10: director sin películas calificadas pierde', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, directores: ['Ana'] }),
          obra({ id: 2, directores: ['Bruno'], calificacion: 1 }),
        ],
        2026,
      ).directorTop,
    ).toEqual({ nombre: 'Bruno', obras: 1 });
  });

  it('CA-A2-06 / V10: promedio igual desempata alfabéticamente con nombres no ambiguos', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, directores: ['Bruno'], calificacion: 4 }),
          obra({ id: 2, directores: ['Ana'], calificacion: 4 }),
        ],
        2026,
      ).directorTop,
    ).toEqual({ nombre: 'Ana', obras: 1 });
  });

  it('CA-A2-06 / V10: dos directores sin calificadas desempatan alfabéticamente', () => {
    expect(
      resumenAnual(
        [
          obra({ id: 1, directores: ['Bruno'] }),
          obra({ id: 2, directores: ['Ana'] }),
        ],
        2026,
      ).directorTop,
    ).toEqual({ nombre: 'Ana', obras: 1 });
  });

  it('CA-A2-06 / V10: sin directores disponibles no inventa un ganador', () => {
    expect(
      resumenAnual(
        [obra({ id: 1, directores: [], estadoMetadatos: 'completos' })],
        2026,
      ).directorTop,
    ).toBeNull();
  });
});

describe('resumenAnual — meses D10', () => {
  it('CA-A2-07 / V11: devuelve doce meses, conserva ceros y cuenta tipos distintos', () => {
    const items = [
      obra({ id: 1 }),
      obra({ id: 2, tipo: 'tv' }),
      obra({ id: 3, fecha: FECHAS.marzo }),
    ];
    const result = resumenAnual(items, 2026);
    expect(result.obrasPorMes).toEqual([2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.mesTop).toBe(0);
  });

  it('CA-A2-07 / V11: empate del máximo favorece el mes más reciente', () => {
    const items = [
      obra({ id: 1, fecha: FECHAS.mayo }),
      obra({ id: 2, fecha: FECHAS.mayo }),
      obra({ id: 3, fecha: FECHAS.septiembre }),
      obra({ id: 4, fecha: FECHAS.septiembre }),
    ];
    expect(resumenAnual(items, 2026).mesTop).toBe(8);
  });

  it('CA-A5-02 / V21, parte pura: año vacío tiene doce ceros y ningún mes activo', () => {
    expect(resumenAnual([], 2026)).toMatchObject({
      anio: 2026,
      totalObras: 0,
      peliculas: 0,
      series: 0,
      horas: 0,
      obrasPorMes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      mesTop: null,
    });
  });
});

describe('resumenAnual — destacada D11', () => {
  it('CA-A2-08 / V12: gana mayor calificación personal aunque otra se haya visto después', () => {
    const mejor = obra({ id: 1, calificacion: 5 });
    const reciente = obra({ id: 2, calificacion: 4, fecha: FECHAS.diciembre });
    expect(resumenAnual([reciente, mejor], 2026).destacada).toEqual(
      mejor.entrada,
    );
  });

  it('CA-A2-08 / V12: igualdad de calificación elige vistaEn más reciente', () => {
    const anterior = obra({ id: 1, calificacion: 5, fecha: FECHAS.enero });
    const reciente = obra({ id: 2, calificacion: 5, fecha: FECHAS.septiembre });
    expect(resumenAnual([reciente, anterior], 2026).destacada).toEqual(
      reciente.entrada,
    );
  });

  it('CA-A2-09 / V13: sin calificadas devuelve ausencia para invitar a calificar', () => {
    expect(
      resumenAnual([obra({ id: 1 }), obra({ id: 2, tipo: 'tv' })], 2026)
        .destacada,
    ).toBeNull();
  });
});

describe('contrato puro del resumen', () => {
  it('CA-A2-01 y CA-A3-01 / V05/V14: no muta entradas, metadatos ni su orden', () => {
    const items = [
      obra({ id: 2, fecha: FECHAS.marzo, calificacion: 4 }),
      obra({ id: 1, calificacion: 5 }),
    ];
    const original = structuredClone(items);
    function freeze(value: object) {
      Object.freeze(value);
      const nested: unknown[] = Object.values(value);
      for (const child of nested)
        if (child !== null && typeof child === 'object') freeze(child);
    }
    freeze(items);
    resumenAnual(items, 2026);
    aniosDisponibles(items, 2026);
    expect(items).toEqual(original);
  });
});
