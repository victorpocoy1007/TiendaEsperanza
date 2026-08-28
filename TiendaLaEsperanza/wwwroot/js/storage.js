/* ============================================================
   storage.js
   Motor de datos de Tienda La Esperanza.
   Toda la persistencia ocurre en localStorage bajo una sola clave.
   Este archivo expone el objeto global `App` con utilidades y
   operaciones de negocio usadas por las páginas (dashboard.js,
   tienda.js, cocos.js, hielos.js, prestamos.js, capital.js, backup.js).
   ============================================================ */

(function (window) {
  "use strict";

  const STORAGE_KEY = "tiendaLaEsperanzaData";
  const AREAS = ["Tienda", "Cocos", "Hielos"];

  // ---------- Utilidades de fecha / formato ----------

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function fechaHoy() {
    const d = new Date();
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  function horaAhora() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function formatoMoneda(valor) {
    const n = Number(valor) || 0;
    const signo = n < 0 ? "-" : "";
    const abs = Math.abs(n).toFixed(2);
    const partes = abs.split(".");
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${signo}Q ${partes[0]}.${partes[1]}`;
  }

  function uuid() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  // ---------- Esquema inicial ----------

  function datosVacios() {
    return {
      meta: {
        version: 1,
        creado: fechaHoy()
      },
      capital: {
        actual: 0
      },
      ventas: [],           // Venta diaria Tienda / Hielos: {id, area, monto, fecha, hora}
      ventasCocos: [],       // {id, pelado:{}, entero:{}, vaso:{}, total, totalCocos, fecha, hora}
      salidas: [],           // {id, area, monto, descripcion, fecha, hora, estado}
      retiros: [],           // {id, area, monto, descripcion, fecha, hora}
      comprasCocos: [],      // {id, cantidad, costo, descripcion, fecha, hora}
      desechosCocos: [],     // {id, cantidad, motivo, fecha, hora}
      prestamos: [],         // {id, areaOrigen, areaDestino, monto, descripcion, fecha, hora, estado, fechaPago, horaPago}
      historial: [],         // registro unificado de todos los movimientos de dinero
      cierres: []             // {id, fecha, hora, resumen:{...}}
    };
  }

  // ---------- Carga / guardado ----------

  function cargar() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const inicial = datosVacios();
        guardar(inicial);
        return inicial;
      }
      const datos = JSON.parse(raw);
      // Asegura que existan todas las colecciones (por si se importa un backup viejo/parcial)
      const base = datosVacios();
      return Object.assign(base, datos);
    } catch (e) {
      console.error("Error leyendo datos, se reinicia el almacenamiento local.", e);
      const inicial = datosVacios();
      guardar(inicial);
      return inicial;
    }
  }

  function guardar(datos) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  }

  // ---------- Historial unificado ----------

  function agregarHistorial(datos, entrada) {
    datos.historial.unshift(Object.assign({
      id: uuid(),
      fecha: fechaHoy(),
      hora: horaAhora(),
      estado: null
    }, entrada));
  }

  // ---------- Cálculos derivados ----------

  function calcularExistenciaCocos(datos) {
    const comprados = datos.comprasCocos.reduce((s, c) => s + Number(c.cantidad || 0), 0);
    const vendidos = datos.ventasCocos.reduce((s, v) => s + Number(v.totalCocos || 0), 0);
    const desechados = datos.desechosCocos.reduce((s, d) => s + Number(d.cantidad || 0), 0);
    const existencia = comprados - vendidos - desechados;
    return {
      existencia: Math.max(0, existencia),
      comprados,
      vendidos,
      desechados
    };
  }

  function esHoy(fecha) { return fecha === fechaHoy(); }

  function ventaDiariaRegistrada(datos, area) {
    return datos.ventas.some(v => v.area === area && esHoy(v.fecha));
  }

  function totalSalidasPendientes(datos, area) {
    return datos.salidas
      .filter(s => s.area === area && s.estado === "pendiente")
      .reduce((s, x) => s + Number(x.monto || 0), 0);
  }

  function totalHoy(lista, campoFecha, campoMonto) {
    return lista.filter(x => esHoy(x[campoFecha])).reduce((s, x) => s + Number(x[campoMonto] || 0), 0);
  }

  // Saldo neto de préstamos por área (positivo = le deben a esta área; negativo = esta área debe)
  function saldoPrestamosArea(datos, area) {
    let saldo = 0;
    datos.prestamos.forEach(p => {
      if (p.estado !== "pendiente") return;
      if (p.areaOrigen === area) saldo += Number(p.monto || 0);   // le deben
      if (p.areaDestino === area) saldo -= Number(p.monto || 0);  // debe
    });
    return saldo;
  }

  function totalPrestamos(datos, campo, estadoFiltro) {
    return datos.prestamos
      .filter(p => (estadoFiltro ? p.estado === estadoFiltro : true))
      .reduce((s, p) => s + Number(p.monto || 0), 0);
  }

  function recalcularCapital(datos) {
    const totalVentas = datos.ventas.reduce((s, v) => s + Number(v.monto || 0), 0)
      + datos.ventasCocos.reduce((s, v) => s + Number(v.total || 0), 0);
    const totalSalidasProcesadas = datos.salidas
      .filter(s => s.estado === "procesada")
      .reduce((s, x) => s + Number(x.monto || 0), 0);
    const totalRetiros = datos.retiros.reduce((s, r) => s + Number(r.monto || 0), 0);
    // Los préstamos entre áreas no afectan el capital total del negocio.
    datos.capital.actual = totalVentas - totalSalidasProcesadas - totalRetiros;
    return datos.capital.actual;
  }

  // ---------- Operaciones de negocio: Ventas diarias (Tienda / Hielos) ----------

  function registrarVentaDiaria(area, monto) {
    const datos = cargar();
    if (ventaDiariaRegistrada(datos, area)) {
      return { ok: false, mensaje: "La venta de hoy ya fue registrada." };
    }
    if (!(monto > 0)) {
      return { ok: false, mensaje: "El monto de la venta debe ser mayor a cero." };
    }
    const registro = { id: uuid(), area, monto: Number(monto), fecha: fechaHoy(), hora: horaAhora() };
    datos.ventas.push(registro);
    agregarHistorial(datos, { tipo: "VENTA", area, monto: Number(monto), descripcion: `Venta diaria ${area}` });
    recalcularCapital(datos);
    guardar(datos);
    return { ok: true, registro };
  }

  // ---------- Operaciones de negocio: Salidas ----------

  function agregarSalidaPendiente(area, monto, descripcion) {
    const datos = cargar();
    if (!(monto > 0)) return { ok: false, mensaje: "El monto de la salida debe ser mayor a cero." };
    const registro = {
      id: uuid(), area, monto: Number(monto),
      descripcion: (descripcion || "").trim() || null,
      fecha: fechaHoy(), hora: horaAhora(), estado: "pendiente"
    };
    datos.salidas.push(registro);
    guardar(datos);
    return { ok: true, registro };
  }

  function procesarSalidasPendientes(area) {
    const datos = cargar();
    const pendientes = datos.salidas.filter(s => s.area === area && s.estado === "pendiente");
    if (pendientes.length === 0) {
      return { ok: false, mensaje: "No hay salidas pendientes para procesar." };
    }
    const total = pendientes.reduce((s, x) => s + Number(x.monto || 0), 0);
    pendientes.forEach(s => { s.estado = "procesada"; });
    agregarHistorial(datos, { tipo: "SALIDA", area, monto: total, descripcion: `Salidas del día (${pendientes.length})`, estado: "procesada" });
    recalcularCapital(datos);
    guardar(datos);
    return { ok: true, total, cantidad: pendientes.length };
  }

  function eliminarSalidaPendiente(id) {
    const datos = cargar();
    const idx = datos.salidas.findIndex(s => s.id === id && s.estado === "pendiente");
    if (idx === -1) return { ok: false, mensaje: "La salida no existe o ya fue procesada." };
    datos.salidas.splice(idx, 1);
    guardar(datos);
    return { ok: true };
  }

  // ---------- Operaciones de negocio: Retiros ----------

  function registrarRetiro(area, monto, descripcion) {
    const datos = cargar();
    if (!(monto > 0)) return { ok: false, mensaje: "El monto del retiro debe ser mayor a cero." };
    const registro = {
      id: uuid(), area, monto: Number(monto),
      descripcion: (descripcion || "").trim() || null,
      fecha: fechaHoy(), hora: horaAhora()
    };
    datos.retiros.push(registro);
    agregarHistorial(datos, { tipo: "RETIRO", area, monto: Number(monto), descripcion: registro.descripcion || "Retiro directo" });
    recalcularCapital(datos);
    guardar(datos);
    return { ok: true, registro };
  }

  // ---------- Operaciones de negocio: Cocos ----------

  function registrarCompraCocos(cantidad, costo, descripcion) {
    const datos = cargar();
    cantidad = Number(cantidad);
    costo = Number(costo);
    if (!(cantidad > 0)) return { ok: false, mensaje: "La cantidad de cocos comprados debe ser mayor a cero." };
    if (!(costo >= 0)) return { ok: false, mensaje: "El costo de la compra no puede ser negativo." };
    const registro = {
      id: uuid(), cantidad, costo,
      descripcion: (descripcion || "").trim() || null,
      fecha: fechaHoy(), hora: horaAhora()
    };
    datos.comprasCocos.push(registro);
    agregarHistorial(datos, { tipo: "COMPRA_COCOS", area: "Cocos", monto: costo, descripcion: `Compra de ${cantidad} cocos` });
    recalcularCapital(datos);
    guardar(datos);
    const existencia = calcularExistenciaCocos(datos);
    return { ok: true, registro, existencia: existencia.existencia };
  }

  function registrarVentaCocos(tipos) {
    // tipos = { pelado: {seleccionado, precio, cantidad}, entero: {...}, vaso: {...} }
    const datos = cargar();
    const tiposActivos = Object.keys(tipos).filter(k => tipos[k].seleccionado);
    if (tiposActivos.length === 0) {
      return { ok: false, mensaje: "Debe seleccionar al menos un tipo de coco." };
    }
    let totalCocos = 0;
    let totalMonto = 0;
    tiposActivos.forEach(k => {
      const cant = Number(tipos[k].cantidad) || 0;
      const precio = Number(tipos[k].precio) || 0;
      if (cant <= 0) return;
      totalCocos += cant;
      totalMonto += cant * precio;
    });
    if (totalCocos <= 0) {
      return { ok: false, mensaje: "Debe indicar una cantidad mayor a cero en al menos un tipo seleccionado." };
    }
    const existenciaInfo = calcularExistenciaCocos(datos);
    if (totalCocos > existenciaInfo.existencia) {
      return { ok: false, mensaje: "No hay suficiente cantidad de cocos disponibles." };
    }
    const registro = {
      id: uuid(),
      pelado: { seleccionado: !!tipos.pelado.seleccionado, precio: Number(tipos.pelado.precio) || 0, cantidad: Number(tipos.pelado.cantidad) || 0 },
      entero: { seleccionado: !!tipos.entero.seleccionado, precio: Number(tipos.entero.precio) || 0, cantidad: Number(tipos.entero.cantidad) || 0 },
      vaso: { seleccionado: !!tipos.vaso.seleccionado, precio: Number(tipos.vaso.precio) || 0, cantidad: Number(tipos.vaso.cantidad) || 0 },
      total: totalMonto,
      totalCocos: totalCocos,
      fecha: fechaHoy(),
      hora: horaAhora()
    };
    datos.ventasCocos.push(registro);
    agregarHistorial(datos, { tipo: "VENTA_COCOS", area: "Cocos", monto: totalMonto, descripcion: `Venta de ${totalCocos} cocos` });
    recalcularCapital(datos);
    guardar(datos);
    const existencia = calcularExistenciaCocos(datos);
    return { ok: true, registro, existencia: existencia.existencia };
  }

  function registrarDesechoCocos(cantidad, motivo) {
    const datos = cargar();
    cantidad = Number(cantidad);
    if (!(cantidad > 0)) return { ok: false, mensaje: "La cantidad desechada debe ser mayor a cero." };
    const existenciaInfo = calcularExistenciaCocos(datos);
    if (cantidad > existenciaInfo.existencia) {
      return { ok: false, mensaje: "No hay suficiente cantidad de cocos disponibles para desechar." };
    }
    const registro = {
      id: uuid(), cantidad,
      motivo: (motivo || "").trim() || null,
      fecha: fechaHoy(), hora: horaAhora()
    };
    datos.desechosCocos.push(registro);
    guardar(datos);
    const existencia = calcularExistenciaCocos(datos);
    return { ok: true, registro, existencia: existencia.existencia };
  }

  // ---------- Operaciones de negocio: Préstamos ----------

  function crearPrestamo(areaOrigen, areaDestino, monto, descripcion) {
    const datos = cargar();
    if (areaOrigen === areaDestino) {
      return { ok: false, mensaje: "Un área no puede prestarse dinero a sí misma." };
    }
    if (!(monto > 0)) return { ok: false, mensaje: "El monto del préstamo debe ser mayor a cero." };
    const registro = {
      id: uuid(), areaOrigen, areaDestino, monto: Number(monto),
      descripcion: (descripcion || "").trim() || null,
      fecha: fechaHoy(), hora: horaAhora(),
      estado: "pendiente", fechaPago: null, horaPago: null
    };
    datos.prestamos.push(registro);
    agregarHistorial(datos, {
      tipo: "PRESTAMO", area: `${areaOrigen} → ${areaDestino}`, monto: Number(monto),
      descripcion: registro.descripcion || `Préstamo de ${areaOrigen} a ${areaDestino}`, estado: "pendiente"
    });
    guardar(datos);
    return { ok: true, registro };
  }

  function pagarPrestamo(id) {
    const datos = cargar();
    const p = datos.prestamos.find(x => x.id === id);
    if (!p) return { ok: false, mensaje: "El préstamo no existe." };
    if (p.estado === "pagado") return { ok: false, mensaje: "Este préstamo ya fue pagado." };
    p.estado = "pagado";
    p.fechaPago = fechaHoy();
    p.horaPago = horaAhora();
    agregarHistorial(datos, {
      tipo: "PAGO_PRESTAMO", area: `${p.areaDestino} → ${p.areaOrigen}`, monto: p.monto,
      descripcion: `Pago de deuda: ${p.areaDestino} a ${p.areaOrigen}`, estado: "pagado"
    });
    guardar(datos);
    return { ok: true, registro: p };
  }

  // ---------- Cierre de día ----------

  function yaHayCierreHoy(datos) {
    return datos.cierres.some(c => c.fecha === fechaHoy());
  }

  function obtenerResumenDia() {
    const datos = cargar();
    const existenciaInfo = calcularExistenciaCocos(datos);

    const ventasTienda = datos.ventas.filter(v => v.area === "Tienda" && esHoy(v.fecha)).reduce((s, v) => s + Number(v.monto), 0);
    const ventasHielos = datos.ventas.filter(v => v.area === "Hielos" && esHoy(v.fecha)).reduce((s, v) => s + Number(v.monto), 0);
    const ventasCocos = datos.ventasCocos.filter(v => esHoy(v.fecha)).reduce((s, v) => s + Number(v.total), 0);
    const ventasTotal = ventasTienda + ventasHielos + ventasCocos;

    const salidasTienda = totalHoyProcesadas(datos, "Tienda");
    const salidasCocos = totalHoyProcesadas(datos, "Cocos");
    const salidasHielos = totalHoyProcesadas(datos, "Hielos");
    const salidasTotal = salidasTienda + salidasCocos + salidasHielos;

    const retirosTotal = datos.retiros.filter(r => esHoy(r.fecha)).reduce((s, r) => s + Number(r.monto), 0);

    const prestamosHoy = datos.prestamos.filter(p => esHoy(p.fecha));
    const prestamosRealizados = prestamosHoy.reduce((s, p) => s + Number(p.monto), 0);
    const pagosHoy = datos.prestamos.filter(p => p.estado === "pagado" && p.fechaPago === fechaHoy());
    const prestamosRecibidos = pagosHoy.reduce((s, p) => s + Number(p.monto), 0);

    const cocosComprados = datos.comprasCocos.filter(c => esHoy(c.fecha)).reduce((s, c) => s + Number(c.cantidad), 0);
    const cocosVendidos = datos.ventasCocos.filter(v => esHoy(v.fecha)).reduce((s, v) => s + Number(v.totalCocos), 0);
    const cocosDesechados = datos.desechosCocos.filter(d => esHoy(d.fecha)).reduce((s, d) => s + Number(d.cantidad), 0);

    const resultadoNeto = ventasTotal - salidasTotal - retirosTotal;

    return {
      fecha: fechaHoy(),
      ventasTienda, ventasCocos, ventasHielos, ventasTotal,
      salidasTienda, salidasCocos, salidasHielos, salidasTotal,
      retirosTotal,
      prestamosRecibidos, prestamosRealizados,
      cocosComprados, cocosVendidos, cocosDesechados,
      cocosExistencia: existenciaInfo.existencia,
      resultadoNeto,
      capitalFinal: datos.capital.actual,
      yaCerrado: yaHayCierreHoy(datos)
    };
  }

  function totalHoyProcesadas(datos, area) {
    return datos.salidas
      .filter(s => s.area === area && s.estado === "procesada" && esHoy(s.fecha))
      .reduce((s, x) => s + Number(x.monto || 0), 0);
  }

  function cerrarDia() {
    const datos = cargar();
    if (yaHayCierreHoy(datos)) {
      return { ok: false, mensaje: "El día de hoy ya fue cerrado." };
    }
    const resumen = obtenerResumenDia();
    const registro = { id: uuid(), fecha: fechaHoy(), hora: horaAhora(), resumen };
    datos.cierres.push(registro);
    agregarHistorial(datos, { tipo: "CIERRE_DIA", area: "General", monto: resumen.resultadoNeto, descripcion: "Cierre del día", estado: "cerrado" });
    guardar(datos);
    return { ok: true, registro };
  }

  // ---------- Backup: exportar / importar / borrar ----------

  function exportarJSON() {
    const datos = cargar();
    const envelope = {
      version: "1.0",
      fechaExportacion: fechaHoy(),
      horaExportacion: horaAhora(),
      datos
    };
    return envelope;
  }

  function nombreArchivoBackup() {
    const d = new Date();
    return `backup-tienda-la-esperanza-${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.json`;
  }

  function validarEstructuraBackup(obj) {
    if (!obj || typeof obj !== "object") return false;
    const datos = obj.datos || obj; // admite archivo con o sin envelope
    const claves = ["ventas", "ventasCocos", "salidas", "retiros", "comprasCocos", "desechosCocos", "prestamos", "historial", "cierres", "capital"];
    return claves.every(c => c in datos);
  }

  function importarJSON(obj) {
    if (!validarEstructuraBackup(obj)) {
      return { ok: false, mensaje: "El archivo no tiene una estructura válida de respaldo." };
    }
    const datos = obj.datos || obj;
    const base = datosVacios();
    const combinado = Object.assign(base, datos);
    recalcularCapital(combinado);
    guardar(combinado);
    return { ok: true };
  }

  function borrarTodosLosDatos() {
    const vacio = datosVacios();
    guardar(vacio);
    return { ok: true };
  }

  function exportarCSV(tipo) {
    const datos = cargar();
    let filas = [];
    let encabezado = [];
    switch (tipo) {
      case "historial":
        encabezado = ["Fecha", "Hora", "Tipo", "Área", "Monto", "Descripción", "Estado"];
        filas = datos.historial.map(h => [h.fecha, h.hora, h.tipo, h.area, h.monto, h.descripcion || "", h.estado || ""]);
        break;
      case "cocos":
        encabezado = ["Fecha", "Hora", "Tipo movimiento", "Cantidad", "Costo", "Descripción"];
        filas = [
          ...datos.comprasCocos.map(c => [c.fecha, c.hora, "COMPRA", c.cantidad, c.costo, c.descripcion || ""]),
          ...datos.ventasCocos.map(v => [v.fecha, v.hora, "VENTA", v.totalCocos, v.total, "Venta de cocos"]),
          ...datos.desechosCocos.map(d => [d.fecha, d.hora, "DESECHO", d.cantidad, "", d.motivo || ""])
        ];
        break;
      case "prestamos":
        encabezado = ["Fecha", "Hora", "Área origen", "Área destino", "Monto", "Estado", "Fecha pago"];
        filas = datos.prestamos.map(p => [p.fecha, p.hora, p.areaOrigen, p.areaDestino, p.monto, p.estado, p.fechaPago || ""]);
        break;
      default:
        encabezado = ["Fecha", "Hora", "Tipo", "Área", "Monto", "Descripción", "Estado"];
        filas = datos.historial.map(h => [h.fecha, h.hora, h.tipo, h.area, h.monto, h.descripcion || "", h.estado || ""]);
    }
    const escapar = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lineas = [encabezado.map(escapar).join(",")].concat(filas.map(f => f.map(escapar).join(",")));
    return lineas.join("\r\n");
  }

  // ---------- API pública ----------

  window.App = {
    AREAS,
    fechaHoy,
    horaAhora,
    formatoMoneda,
    uuid,
    cargar,
    guardar,
    calcularExistenciaCocos,
    ventaDiariaRegistrada,
    totalSalidasPendientes,
    totalHoy,
    saldoPrestamosArea,
    totalPrestamos,
    recalcularCapital,
    registrarVentaDiaria,
    agregarSalidaPendiente,
    procesarSalidasPendientes,
    eliminarSalidaPendiente,
    registrarRetiro,
    registrarCompraCocos,
    registrarVentaCocos,
    registrarDesechoCocos,
    crearPrestamo,
    pagarPrestamo,
    obtenerResumenDia,
    cerrarDia,
    yaHayCierreHoy,
    exportarJSON,
    nombreArchivoBackup,
    importarJSON,
    validarEstructuraBackup,
    borrarTodosLosDatos,
    exportarCSV
  };

})(window);
