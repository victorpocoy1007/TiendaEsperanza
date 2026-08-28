/* ============================================================
   prestamos.js — Página de Préstamos entre áreas
   ============================================================ */

(function () {
  "use strict";

  function render() {
    const datos = App.cargar();

    const pendientes = datos.prestamos.filter(p => p.estado === "pendiente").sort((a, b) => (a.fecha + a.hora < b.fecha + b.hora ? 1 : -1));
    const pendientesEl = document.getElementById("prestamosPendientesLista");
    if (pendientes.length === 0) {
      pendientesEl.innerHTML = '<div class="empty-state">No hay deudas pendientes.</div>';
    } else {
      pendientesEl.innerHTML = pendientes.map(p => `
        <div class="list-row" data-pagar="${p.id}" style="cursor:pointer;">
          <div class="list-row-main">
            <div class="list-row-title">${p.areaOrigen} → ${p.areaDestino}</div>
            <div class="list-row-sub">${p.descripcion || "Sin descripción"} · ${p.fecha} ${p.hora} · <span class="badge badge-pendiente">PENDIENTE</span></div>
          </div>
          <div class="list-row-amount negativo">${App.formatoMoneda(p.monto)}</div>
        </div>
      `).join("");
      pendientesEl.querySelectorAll("[data-pagar]").forEach(row => {
        row.addEventListener("click", function () {
          const id = this.getAttribute("data-pagar");
          const p = datos.prestamos.find(x => x.id === id);
          UI.abrirModal({
            titulo: "¿Desea marcar esta deuda como pagada?",
            html: `<p>${p.areaDestino} le paga a ${p.areaOrigen}</p><div class="modal-amount">${App.formatoMoneda(p.monto)}</div>`,
            confirmText: "Pagar deuda",
            confirmClass: "btn-success",
            onConfirm: function () {
              const r = App.pagarPrestamo(id);
              if (r.ok) { UI.toast("✓ Deuda pagada exitosamente.", "success"); render(); }
              else { UI.toast(r.mensaje, "error"); }
            }
          });
        });
      });
    }

    const pagados = datos.prestamos.filter(p => p.estado === "pagado").sort((a, b) => (a.fechaPago + a.horaPago < b.fechaPago + b.horaPago ? 1 : -1));
    const histEl = document.getElementById("prestamosHistorialLista");
    if (pagados.length === 0) {
      histEl.innerHTML = '<div class="empty-state">Sin préstamos pagados todavía.</div>';
    } else {
      histEl.innerHTML = pagados.map(p => `
        <div class="list-row">
          <div class="list-row-main">
            <div class="list-row-title">${p.areaOrigen} → ${p.areaDestino}</div>
            <div class="list-row-sub">${p.descripcion || "Sin descripción"} · Pagado el ${p.fechaPago} ${p.horaPago} · <span class="badge badge-pagado">PAGADO</span></div>
          </div>
          <div class="list-row-amount positivo">${App.formatoMoneda(p.monto)}</div>
        </div>
      `).join("");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();

    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        this.classList.add("active");
        document.getElementById("panel-" + this.getAttribute("data-tab")).classList.add("active");
      });
    });

    document.getElementById("btnCrearPrestamo").addEventListener("click", function () {
      const origen = document.getElementById("prestamoOrigen").value;
      const destino = document.getElementById("prestamoDestino").value;
      const monto = parseFloat(document.getElementById("prestamoMonto").value);
      const desc = document.getElementById("prestamoDescripcion").value;

      if (origen === destino) { UI.toast("Un área no puede prestarse dinero a sí misma.", "error"); return; }
      if (!(monto > 0)) { UI.toast("Ingresa un monto válido mayor a cero.", "error"); return; }

      UI.confirmarMonto(`Confirmar préstamo de ${origen} a ${destino}`, monto, function () {
        const r = App.crearPrestamo(origen, destino, monto, desc);
        if (r.ok) {
          UI.toast("✓ Préstamo registrado.", "success");
          document.getElementById("prestamoMonto").value = "";
          document.getElementById("prestamoDescripcion").value = "";
          render();
        } else {
          UI.toast(r.mensaje, "error");
        }
      });
    });
  });
})();
