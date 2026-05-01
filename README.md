# Split Meet

Aplicacion web estatica para dividir gastos de una reunion entre varios participantes.

## Caracteristicas

- Carga dinamica de participantes y el importe que gasto cada uno.
- Calculo del total gastado y del promedio por persona.
- Resultado individual indicando quien debe pagar y quien debe recibir dinero.
- Sugerencia de pagos entre participantes para saldar la cuenta.
- Calculos internos en centavos para evitar errores de redondeo con decimales.
- Boton para agregar participantes desde la fila principal de acciones.
- Boton para iniciar una nueva cuenta sin borrar el historial.
- Seleccion automatica del contenido de los inputs al hacer foco o click.
- Modo claro y modo oscuro con preferencia guardada en el navegador.
- Logo adaptado por tema: version negra para modo claro y version blanca para modo oscuro.
- Historial local de las ultimas cuentas calculadas.
- Contador local de visitas.
- Diseno responsive para desktop y mobile.

## Persistencia local

La app usa `localStorage` para guardar:

- Tema seleccionado.
- Historial de cuentas anteriores.
- Contador de visitas local.

El historial y el contador son locales al navegador/dispositivo. No son globales porque la app no usa backend.

## Uso

Abrir `index.html` en el navegador.

1. Ingresar los nombres de los participantes.
2. Cargar el importe gastado por cada persona.
3. Agregar participantes si hace falta.
4. Presionar `Calcular reparto`.
5. Revisar saldos individuales y pagos sugeridos.

## Estructura

- `index.html`: estructura de la interfaz.
- `styles.css`: estilos, responsive y temas.
- `src/index.js`: logica de calculo, historial, tema y eventos.
- `img/`: logos usados en el footer.
