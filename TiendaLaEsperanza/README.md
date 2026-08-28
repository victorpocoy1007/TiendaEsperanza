# Tienda La Esperanza — Sistema Web de Inventario y Control

Aplicación web en **C# + ASP.NET Core MVC**, pensada para usarse principalmente
desde celular. No usa base de datos: toda la información se guarda en el
`localStorage` del navegador, con respaldo/restauración vía JSON y
exportación a CSV.

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download) o superior.

## Cómo ejecutar

```bash
cd TiendaLaEsperanza
dotnet restore
dotnet run
```

Luego abre en el navegador la URL que muestre la consola
(por defecto `http://localhost:5217`). Desde el celular, usa la misma red
Wi-Fi y la IP de la computadora en vez de `localhost`
(por ejemplo `http://192.168.1.x:5217`), o publica la app en un hosting.

## Estructura del proyecto

```
Models/         Clases que documentan la forma de los datos (ver wwwroot/js/storage.js
                 para la fuente real de verdad, que vive en localStorage).
Controllers/    Controladores MVC delgados: cada uno solo sirve su vista.
Views/          Una carpeta por área (Home, Tienda, Cocos, Hielos, Prestamos,
                 Capital, Backup) + Views/Shared/_Layout.cshtml.
wwwroot/css/    site.css — diseño móvil, tarjetas, botones grandes, colores.
wwwroot/js/
  storage.js     Motor de datos: esquema de localStorage y toda la lógica de
                 negocio (ventas, salidas, retiros, cocos, préstamos, cierre,
                 backups). Expone el objeto global `App`.
  ui.js          Menú lateral, modal de confirmación y mensajes toast.
                 Expone el objeto global `UI`.
  area-simple.js Lógica reutilizada por Tienda y Hielos (venta diaria,
                 salidas, retiros, resumen, historial).
  dashboard.js   Página de Inicio.
  tienda.js      Página Tienda (usa area-simple.js).
  hielos.js      Página Hielos (usa area-simple.js).
  cocos.js       Página Cocos (inventario, venta por tipo, compras, desperdicio).
  prestamos.js   Página de Préstamos entre áreas.
  capital.js     Capital general, cierre del día e historial con filtros.
  backup.js      Exportar/importar JSON, exportar CSV, borrar todos los datos.
```

## Estructura de los datos en localStorage

Clave: `tiendaLaEsperanzaData`

```jsonc
{
  "capital": { "actual": 0 },
  "ventas": [ { "id", "area", "monto", "fecha", "hora" } ],
  "ventasCocos": [ { "id", "pelado": {...}, "entero": {...}, "vaso": {...}, "total", "totalCocos", "fecha", "hora" } ],
  "salidas": [ { "id", "area", "monto", "descripcion", "fecha", "hora", "estado" } ],
  "retiros": [ { "id", "area", "monto", "descripcion", "fecha", "hora" } ],
  "comprasCocos": [ { "id", "cantidad", "costo", "descripcion", "fecha", "hora" } ],
  "desechosCocos": [ { "id", "cantidad", "motivo", "fecha", "hora" } ],
  "prestamos": [ { "id", "areaOrigen", "areaDestino", "monto", "descripcion", "fecha", "hora", "estado", "fechaPago", "horaPago" } ],
  "historial": [ { "id", "tipo", "area", "monto", "fecha", "hora", "descripcion", "estado" } ],
  "cierres": [ { "id", "fecha", "hora", "resumen": {...} } ]
}
```

## Relación ventas ↔ capital ↔ préstamos ↔ inventario de cocos

- **Capital** = suma de ventas − salidas *procesadas* − retiros.
- **Préstamos** entre Tienda/Cocos/Hielos **no** cambian el capital total del
  negocio: solo generan una deuda pendiente entre áreas
  (ver `saldoPrestamosArea` en `storage.js`).
- **Inventario de cocos** = compras − ventas de cocos − desechos, nunca
  negativo. Se recalcula desde el historial de movimientos en cada operación
  (no depende de un número escrito a mano).
- **Cierre del día** solo congela un resumen y marca el día como cerrado;
  el capital y la existencia de cocos **no se reinician** al día siguiente.

## Reglas de validación implementadas

- No se permite registrar dos veces la venta diaria de Tienda/Hielos el
  mismo día.
- No se permite que la existencia de cocos quede negativa (venta o
  desperdicio se rechazan si no alcanza el inventario).
- No se permite préstamo de un área a sí misma.
- No se permite pagar un préstamo ya pagado.
- Las salidas procesadas quedan marcadas como `"procesada"` para que no se
  vuelvan a descontar del capital.
- Toda acción que modifica capital o inventario pide confirmación mediante
  un modal.

## Datos de ejemplo

El proyecto inicia con el almacenamiento vacío (existencia de cocos en 0,
capital en Q0.00) para reflejar el primer uso real de la tienda. Si quieres
datos de ejemplo, puedes registrar manualmente una compra de cocos, una
venta diaria de Tienda y una venta de cocos desde la interfaz — quedarán
guardados en tu navegador igual que en producción.
