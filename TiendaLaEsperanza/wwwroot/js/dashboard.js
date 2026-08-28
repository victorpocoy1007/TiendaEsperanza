/* ============================================================
   dashboard.js — Pantalla de Inicio
   ============================================================ */

(function () {
  "use strict";

  function render() {
    const datos = App.cargar();
    App.recalcularCapital(datos);
    App.guardar(datos);
    const resumen = App.obtenerResumenDia();

    set("dashCapital", App.formatoMoneda(datos.capital.actual));
    set("dashVentasTienda", App.formatoMoneda(resumen.ventasTienda));
    set("dashVentasCocos", App.formatoMoneda(resumen.ventasCocos));
    set("dashVentasHielos", App.formatoMoneda(resumen.ventasHielos));
    set("dashVentasTotal", App.formatoMoneda(resumen.ventasTotal));

    set("dashSalidasTienda", App.formatoMoneda(resumen.salidasTienda));
    set("dashSalidasCocos", App.formatoMoneda(resumen.salidasCocos));
    set("dashSalidasHielos", App.formatoMoneda(resumen.salidasHielos));
    set("dashSalidasTotal", App.formatoMoneda(resumen.salidasTotal));

    set("dashRetiros", App.formatoMoneda(resumen.retirosTotal));

    const resultadoEl = document.getElementById("dashResultado");
    resultadoEl.textContent = App.formatoMoneda(resumen.resultadoNeto);
    resultadoEl.classList.toggle("negativo", resumen.resultadoNeto < 0);

    const prestado = App.totalPrestamos(datos, "monto", null);
    const deudas = datos.prestamos.filter(p => p.estado === "pendiente").reduce((s, p) => s + Number(p.monto), 0);
    const recibido = datos.prestamos.filter(p => p.estado === "pagado").reduce((s, p) => s + Number(p.monto), 0);
    set("dashPrestado", App.formatoMoneda(prestado));
    set("dashRecibido", App.formatoMoneda(recibido));
    set("dashDeudas", App.formatoMoneda(deudas));

    renderActividad(datos);

    const btnCerrar = document.getElementById("btnCerrarDia");
    if (resumen.yaCerrado) {
      btnCerrar.disabled = true;
      btnCerrar.textContent = "Día ya cerrado";
    }
  }

  function set(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function renderActividad(datos) {
    const cont = document.getElementById("dashActividad");
    const items = datos.historial.slice(0, 8);
    if (items.length === 0) {
      cont.innerHTML = '<div class="empty-state">Sin movimientos todavía.</div>';
      return;
    }
    cont.innerHTML = items.map(h => `
      <div class="list-row">
        <div class="list-row-main">
          <div class="list-row-title">${etiquetaTipo(h.tipo)}</div>
          <div class="list-row-sub">${h.area} · ${h.fecha} ${h.hora}</div>
        </div>
        <div class="list-row-amount ${esNegativo(h.tipo) ? "negativo" : "positivo"}">${esNegativo(h.tipo) ? "-" : "+"}${App.formatoMoneda(Math.abs(h.monto))}</div>
      </div>
    `).join("");
  }

  function esNegativo(tipo) {
    return ["SALIDA", "RETIRO", "COMPRA_COCOS", "PRESTAMO"].includes(tipo);
  }

  function etiquetaTipo(tipo) {
    const mapa = {
      VENTA: "Venta", VENTA_COCOS: "Venta de cocos", SALIDA: "Salida",
      RETIRO: "Retiro", COMPRA_COCOS: "Compra de cocos", PRESTAMO: "Préstamo",
      PAGO_PRESTAMO: "Pago de préstamo", CIERRE_DIA: "Cierre del día"
    };
    return mapa[tipo] || tipo;
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();
    document.getElementById("btnCerrarDia").addEventListener("click", function () {
      const resumen = App.obtenerResumenDia();
      if (resumen.yaCerrado) { UI.toast("El día de hoy ya fue cerrado.", "warning"); return; }
      UI.abrirModal({
        titulo: "Cerrar día",
        html: `
          <p>Se cerrará el día con los siguientes totales:</p>
          <div class="list-row"><div class="list-row-main">Ventas totales</div><div class="list-row-amount positivo">${App.formatoMoneda(resumen.ventasTotal)}</div></div>
          <div class="list-row"><div class="list-row-main">Salidas totales</div><div class="list-row-amount negativo">${App.formatoMoneda(resumen.salidasTotal)}</div></div>
          <div class="list-row"><div class="list-row-main">Retiros</div><div class="list-row-amount negativo">${App.formatoMoneda(resumen.retirosTotal)}</div></div>
          <div class="list-row"><div class="list-row-main">Resultado neto</div><div class="list-row-amount ${resumen.resultadoNeto < 0 ? "negativo" : "positivo"}">${App.formatoMoneda(resumen.resultadoNeto)}</div></div>
          <p class="field-hint">El capital y la existencia de cocos NO se reinician; continúan acumulados para el día siguiente.</p>
        `,
        confirmText: "Cerrar día",
        confirmClass: "btn-primary",
        onConfirm: function () {
          const r = App.cerrarDia();
          if (r.ok) { UI.toast("✓ Día cerrado correctamente.", "success"); render(); }
          else { UI.toast(r.mensaje, "error"); }
        }
      });
    });
  });
})();
