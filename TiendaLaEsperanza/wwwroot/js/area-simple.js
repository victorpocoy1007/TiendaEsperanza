/* ============================================================
   area-simple.js
   Lógica compartida por las áreas "simples" (Tienda y Hielos):
   venta diaria única, salidas pendientes/procesadas, retiro directo,
   resumen del día e historial filtrado por área.
   Se parametriza con el nombre del área para evitar duplicar código.
   ============================================================ */

(function (window) {
  "use strict";

  function iniciarAreaSimple(area, prefijo) {
    function el(id) { return document.getElementById(prefijo + id); }

    function render() {
      const datos = App.cargar();

      // Venta del día
      const ventaHoy = datos.ventas.find(v => v.area === area && v.fecha === App.fechaHoy());
      const cardValue = el("VentaHoy");
      const formCard = document.getElementById("formVentaCard");
      const horaInfo = el("VentaHoraInfo");
      if (ventaHoy) {
        cardValue.textContent = App.formatoMoneda(ventaHoy.monto);
        horaInfo.textContent = `Registrada hoy a las ${ventaHoy.hora}`;
        if (formCard) formCard.style.display = "none";
      } else {
        cardValue.textContent = "Sin registrar";
        horaInfo.textContent = "Venta de hoy ya registrada.".length ? "" : "";
        if (formCard) formCard.style.display = "";
      }

      // Salidas pendientes
      const pendientes = datos.salidas.filter(s => s.area === area && s.estado === "pendiente");
      const total = pendientes.reduce((s, x) => s + Number(x.monto), 0);
      el("TotalSalidasPendientes").textContent = App.formatoMoneda(total);
      const listaEl = el("ListaSalidasPendientes");
      if (pendientes.length === 0) {
        listaEl.innerHTML = '<div class="empty-state">No hay salidas pendientes.</div>';
      } else {
        listaEl.innerHTML = pendientes.map(s => `
          <div class="list-row">
            <div class="list-row-main">
              <div class="list-row-title">${App.formatoMoneda(s.monto)}</div>
              <div class="list-row-sub">${s.descripcion || "Sin descripción"} · ${s.hora}</div>
            </div>
            <button type="button" class="icon-btn" data-eliminar-salida="${s.id}" aria-label="Eliminar" style="color:#d64545;">✕</button>
          </div>
        `).join("");
        listaEl.querySelectorAll("[data-eliminar-salida]").forEach(btn => {
          btn.addEventListener("click", function () {
            App.eliminarSalidaPendiente(this.getAttribute("data-eliminar-salida"));
            render();
          });
        });
      }

      // Resumen del día
      const resumen = App.obtenerResumenDia();
      const ventasHoyArea = App.totalHoy(datos.ventas.filter(v => v.area === area), "fecha", "monto");
      const salidasHoyArea = datos.salidas
        .filter(s => s.area === area && s.estado === "procesada" && s.fecha === App.fechaHoy())
        .reduce((s, x) => s + Number(x.monto), 0);
      const retirosHoyArea = App.totalHoy(datos.retiros.filter(r => r.area === area), "fecha", "monto");
      const saldoPrestamos = App.saldoPrestamosArea(datos, area);

      setIfExists(el("ResVentas"), App.formatoMoneda(ventasHoyArea));
      setIfExists(el("ResSalidas"), App.formatoMoneda(salidasHoyArea));
      setIfExists(el("ResRetiros"), App.formatoMoneda(retirosHoyArea));
      const presEl = el("ResPrestamos");
      if (presEl) {
        presEl.textContent = App.formatoMoneda(saldoPrestamos);
        presEl.classList.toggle("negativo", saldoPrestamos < 0);
      }

      // Historial del área
      const historialEl = el("Historial");
      if (historialEl) {
        const items = datos.historial.filter(h => h.area === area || h.area.includes(area)).slice(0, 30);
        if (items.length === 0) {
          historialEl.innerHTML = '<div class="empty-state">Sin movimientos todavía.</div>';
        } else {
          historialEl.innerHTML = items.map(h => `
            <div class="list-row">
              <div class="list-row-main">
                <div class="list-row-title">${h.tipo.replace("_", " ")}</div>
                <div class="list-row-sub">${h.descripcion || ""} · ${h.fecha} ${h.hora}</div>
              </div>
              <div class="list-row-amount ${["SALIDA", "RETIRO"].includes(h.tipo) ? "negativo" : "positivo"}">${App.formatoMoneda(h.monto)}</div>
            </div>
          `).join("");
        }
      }
    }

    function setIfExists(elm, val) { if (elm) elm.textContent = val; }

    document.addEventListener("DOMContentLoaded", function () {
      render();

      // Tabs
      document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", function () {
          document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
          document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
          this.classList.add("active");
          document.getElementById("panel-" + this.getAttribute("data-tab")).classList.add("active");
        });
      });

      // Registrar venta diaria
      const btnVenta = el("BtnRegistrarVenta") || document.getElementById("btnRegistrarVenta" + prefijo);
      const btnVentaEl = document.getElementById("btnRegistrarVenta" + capitalize(area));
      if (btnVentaEl) {
        btnVentaEl.addEventListener("click", function () {
          const input = el("MontoVenta");
          const monto = parseFloat(input.value);
          if (!(monto > 0)) { UI.toast("Ingresa un monto válido mayor a cero.", "error"); return; }
          UI.confirmarMonto("Confirmar venta diaria", monto, function () {
            const r = App.registrarVentaDiaria(area, monto);
            if (r.ok) { UI.toast("✓ Venta registrada correctamente.", "success"); input.value = ""; render(); }
            else { UI.toast(r.mensaje, "error"); }
          });
        });
      }

      // Agregar salida
      const btnAgregarSalida = document.getElementById("btnAgregarSalida" + capitalize(area));
      if (btnAgregarSalida) {
        btnAgregarSalida.addEventListener("click", function () {
          const monto = parseFloat(el("MontoSalida").value);
          const desc = el("DescSalida").value;
          if (!(monto > 0)) { UI.toast("Ingresa un monto válido mayor a cero.", "error"); return; }
          const r = App.agregarSalidaPendiente(area, monto, desc);
          if (r.ok) { UI.toast("✓ Salida agregada.", "success"); el("MontoSalida").value = ""; el("DescSalida").value = ""; render(); }
          else { UI.toast(r.mensaje, "error"); }
        });
      }

      // Procesar salidas del día
      const btnProcesar = document.getElementById("btnProcesarSalidas" + capitalize(area));
      if (btnProcesar) {
        btnProcesar.addEventListener("click", function () {
          const datos = App.cargar();
          const total = App.totalSalidasPendientes(datos, area);
          if (!(total > 0)) { UI.toast("No hay salidas pendientes para procesar.", "warning"); return; }
          UI.confirmarMonto("Se descontarán del capital", total, function () {
            const r = App.procesarSalidasPendientes(area);
            if (r.ok) { UI.toast("✓ Salidas registradas correctamente.", "success"); render(); }
            else { UI.toast(r.mensaje, "error"); }
          }, `<p class="field-hint">${total > 0 ? "Esta acción no se puede repetir para las mismas salidas." : ""}</p>`);
        });
      }

      // Retiro directo
      const btnRetiro = document.getElementById("btnRetiro" + capitalize(area));
      if (btnRetiro) {
        btnRetiro.addEventListener("click", function () {
          const monto = parseFloat(el("MontoRetiro").value);
          const desc = el("DescRetiro").value;
          if (!(monto > 0)) { UI.toast("Ingresa un monto válido mayor a cero.", "error"); return; }
          UI.confirmarMonto("¿Confirmar retiro?", monto, function () {
            const r = App.registrarRetiro(area, monto, desc);
            if (r.ok) { UI.toast("✓ Retiro registrado.", "success"); el("MontoRetiro").value = ""; el("DescRetiro").value = ""; render(); }
            else { UI.toast(r.mensaje, "error"); }
          });
        });
      }
    });

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  }

  window.iniciarAreaSimple = iniciarAreaSimple;
})(window);
