/* ============================================================
   capital.js — Página de Capital, cierre del día e historial
   ============================================================ */

(function () {
  "use strict";

  function isoAFechaLocal(iso) {
    // iso: YYYY-MM-DD -> DD/MM/YYYY
    if (!iso) return null;
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function renderCapital() {
    const datos = App.cargar();
    App.recalcularCapital(datos);
    App.guardar(datos);

    document.getElementById("capActual").textContent = App.formatoMoneda(datos.capital.actual);

    ["Tienda", "Cocos", "Hielos"].forEach(area => {
      const saldo = App.saldoPrestamosArea(datos, area);
      const el = document.getElementById("saldo" + area);
      el.textContent = App.formatoMoneda(saldo);
      el.classList.toggle("negativo", saldo < 0);
      el.classList.toggle("positivo", saldo > 0);
    });
  }

  function renderCierre() {
    const resumen = App.obtenerResumenDia();
    set("cierreVentasTienda", App.formatoMoneda(resumen.ventasTienda));
    set("cierreVentasCocos", App.formatoMoneda(resumen.ventasCocos));
    set("cierreVentasHielos", App.formatoMoneda(resumen.ventasHielos));
    set("cierreVentasTotal", App.formatoMoneda(resumen.ventasTotal));

    set("cierreSalidasTienda", App.formatoMoneda(resumen.salidasTienda));
    set("cierreSalidasCocos", App.formatoMoneda(resumen.salidasCocos));
    set("cierreSalidasHielos", App.formatoMoneda(resumen.salidasHielos));
    set("cierreSalidasTotal", App.formatoMoneda(resumen.salidasTotal));

    set("cierreRetiros", App.formatoMoneda(resumen.retirosTotal));
    set("cierrePrestamosRecibidos", App.formatoMoneda(resumen.prestamosRecibidos));
    set("cierrePrestamosPrestados", App.formatoMoneda(resumen.prestamosRealizados));

    set("cierreCocosComprados", resumen.cocosComprados);
    set("cierreCocosVendidos", resumen.cocosVendidos);
    set("cierreCocosDesechados", resumen.cocosDesechados);
    set("cierreCocosExistencia", resumen.cocosExistencia);

    const resEl = document.getElementById("cierreResultado");
    resEl.textContent = App.formatoMoneda(resumen.resultadoNeto);
    resEl.classList.toggle("negativo", resumen.resultadoNeto < 0);

    const btn = document.getElementById("btnCerrarDiaCapital");
    if (resumen.yaCerrado) {
      btn.disabled = true;
      btn.textContent = "Día ya cerrado";
    } else {
      btn.disabled = false;
      btn.textContent = "Cerrar día";
    }
  }

  function set(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function renderHistorial() {
    const datos = App.cargar();
    const area = document.getElementById("filtroArea").value;
    const tipo = document.getElementById("filtroTipo").value;
    const fechaIso = document.getElementById("filtroFecha").value;
    const fecha = isoAFechaLocal(fechaIso);

    let items = datos.historial.slice();
    if (area) items = items.filter(h => h.area === area || (typeof h.area === "string" && h.area.includes(area)));
    if (tipo) items = items.filter(h => h.tipo === tipo);
    if (fecha) items = items.filter(h => h.fecha === fecha);

    const cont = document.getElementById("historialGeneralLista");
    if (items.length === 0) {
      cont.innerHTML = '<div class="empty-state">No hay movimientos con estos filtros.</div>';
      return;
    }
    cont.innerHTML = items.slice(0, 200).map(h => `
      <div class="list-row">
        <div class="list-row-main">
          <div class="list-row-title">${h.tipo.replace(/_/g, " ")}</div>
          <div class="list-row-sub">${h.area} · ${h.descripcion || ""} · ${h.fecha} ${h.hora}${h.estado ? " · <span class=\"badge badge-" + h.estado + "\">" + h.estado + "</span>" : ""}</div>
        </div>
        <div class="list-row-amount ${["SALIDA", "RETIRO", "COMPRA_COCOS"].includes(h.tipo) ? "negativo" : "positivo"}">${App.formatoMoneda(h.monto)}</div>
      </div>
    `).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCapital();
    renderCierre();
    renderHistorial();

    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        this.classList.add("active");
        document.getElementById("panel-" + this.getAttribute("data-tab")).classList.add("active");
      });
    });

    ["filtroArea", "filtroTipo", "filtroFecha"].forEach(id => {
      document.getElementById(id).addEventListener("change", renderHistorial);
    });
    document.getElementById("btnLimpiarFiltros").addEventListener("click", function () {
      document.getElementById("filtroArea").value = "";
      document.getElementById("filtroTipo").value = "";
      document.getElementById("filtroFecha").value = "";
      renderHistorial();
    });

    document.getElementById("btnCerrarDiaCapital").addEventListener("click", function () {
      const resumen = App.obtenerResumenDia();
      if (resumen.yaCerrado) { UI.toast("El día de hoy ya fue cerrado.", "warning"); return; }
      UI.abrirModal({
        titulo: "Cerrar día",
        html: `
          <p>Resultado neto del día:</p>
          <div class="modal-amount ${resumen.resultadoNeto < 0 ? "negativo" : ""}">${App.formatoMoneda(resumen.resultadoNeto)}</div>
          <p class="field-hint">El capital y la existencia de cocos NO se reinician; continúan acumulados para el día siguiente.</p>
        `,
        confirmText: "Cerrar día",
        onConfirm: function () {
          const r = App.cerrarDia();
          if (r.ok) { UI.toast("✓ Día cerrado correctamente.", "success"); renderCierre(); renderCapital(); renderHistorial(); }
          else { UI.toast(r.mensaje, "error"); }
        }
      });
    });
  });
})();
