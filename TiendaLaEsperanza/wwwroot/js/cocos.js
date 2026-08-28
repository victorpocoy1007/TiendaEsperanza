/* ============================================================
   cocos.js — Página del área Cocos (la más completa)
   ============================================================ */

(function () {
  "use strict";

  const AREA = "Cocos";

  function render() {
    const datos = App.cargar();
    const inv = App.calcularExistenciaCocos(datos);

    document.getElementById("cocosExistencia").textContent = inv.existencia;
    document.getElementById("cocosComprados").textContent = inv.comprados;
    document.getElementById("cocosVendidos").textContent = inv.vendidos;
    document.getElementById("cocosDesechados").textContent = inv.desechados;

    const ventasHoy = App.totalHoy(datos.ventasCocos, "fecha", "total");
    document.getElementById("cocosVentasHoy").textContent = App.formatoMoneda(ventasHoy);

    const salidasPendientes = App.totalSalidasPendientes(datos, AREA);
    document.getElementById("cocosSalidasPendientesResumen").textContent = App.formatoMoneda(salidasPendientes);

    const gastoTotal = datos.comprasCocos.reduce((s, c) => s + Number(c.costo || 0), 0);
    document.getElementById("cocosGastoTotal").textContent = App.formatoMoneda(gastoTotal);

    // Vendidos hoy por tipo
    const ventasHoyLista = datos.ventasCocos.filter(v => v.fecha === App.fechaHoy());
    document.getElementById("hoyPelados").textContent = ventasHoyLista.reduce((s, v) => s + Number(v.pelado.cantidad || 0), 0);
    document.getElementById("hoyEnteros").textContent = ventasHoyLista.reduce((s, v) => s + Number(v.entero.cantidad || 0), 0);
    document.getElementById("hoyVaso").textContent = ventasHoyLista.reduce((s, v) => s + Number(v.vaso.cantidad || 0), 0);

    // Salidas pendientes (tab)
    const pendientes = datos.salidas.filter(s => s.area === AREA && s.estado === "pendiente");
    const totalPend = pendientes.reduce((s, x) => s + Number(x.monto), 0);
    document.getElementById("cocosTotalSalidasPendientes").textContent = App.formatoMoneda(totalPend);
    const listaEl = document.getElementById("cocosListaSalidasPendientes");
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

    // Historial (compras, ventas, desechos, salidas, retiros de Cocos)
    const historialEl = document.getElementById("cocosHistorial");
    const items = datos.historial.filter(h => h.area === AREA || (typeof h.area === "string" && h.area.includes(AREA))).slice(0, 40);
    if (items.length === 0) {
      historialEl.innerHTML = '<div class="empty-state">Sin movimientos todavía.</div>';
    } else {
      historialEl.innerHTML = items.map(h => `
        <div class="list-row">
          <div class="list-row-main">
            <div class="list-row-title">${h.tipo.replace(/_/g, " ")}</div>
            <div class="list-row-sub">${h.descripcion || ""} · ${h.fecha} ${h.hora}</div>
          </div>
          <div class="list-row-amount ${["SALIDA", "RETIRO", "COMPRA_COCOS"].includes(h.tipo) ? "negativo" : "positivo"}">${App.formatoMoneda(h.monto)}</div>
        </div>
      `).join("");
    }
  }

  function calcularTotalVentaCocos() {
    const tipos = leerTiposFormulario();
    let total = 0;
    Object.keys(tipos).forEach(k => {
      if (!tipos[k].seleccionado) return;
      total += (Number(tipos[k].precio) || 0) * (Number(tipos[k].cantidad) || 0);
    });
    document.getElementById("ventaCocosTotal").textContent = App.formatoMoneda(total);
  }

  function leerTiposFormulario() {
    return {
      pelado: {
        seleccionado: document.getElementById("chkPelado").checked,
        precio: document.getElementById("precioPelado").value,
        cantidad: document.getElementById("cantidadPelado").value
      },
      entero: {
        seleccionado: document.getElementById("chkEntero").checked,
        precio: document.getElementById("precioEntero").value,
        cantidad: document.getElementById("cantidadEntero").value
      },
      vaso: {
        seleccionado: document.getElementById("chkVaso").checked,
        precio: document.getElementById("precioVaso").value,
        cantidad: document.getElementById("cantidadVaso").value
      }
    };
  }

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

    // Mostrar/ocultar campos por tipo de coco
    [["chkPelado", "camposPelado"], ["chkEntero", "camposEntero"], ["chkVaso", "camposVaso"]].forEach(([chkId, campoId]) => {
      document.getElementById(chkId).addEventListener("change", function () {
        document.getElementById(campoId).style.display = this.checked ? "grid" : "none";
        calcularTotalVentaCocos();
      });
    });
    ["precioPelado", "cantidadPelado", "precioEntero", "cantidadEntero", "precioVaso", "cantidadVaso"].forEach(id => {
      document.getElementById(id).addEventListener("input", calcularTotalVentaCocos);
    });

    // Registrar venta de cocos
    document.getElementById("btnRegistrarVentaCocos").addEventListener("click", function () {
      const tipos = leerTiposFormulario();
      const seleccionados = Object.keys(tipos).filter(k => tipos[k].seleccionado);
      if (seleccionados.length === 0) { UI.toast("Selecciona al menos un tipo de coco.", "error"); return; }

      let total = 0, totalCocos = 0;
      seleccionados.forEach(k => {
        total += (Number(tipos[k].precio) || 0) * (Number(tipos[k].cantidad) || 0);
        totalCocos += Number(tipos[k].cantidad) || 0;
      });

      UI.confirmarMonto("Confirmar venta de cocos", total, function () {
        const r = App.registrarVentaCocos(tipos);
        if (r.ok) {
          UI.toast("✓ Venta registrada correctamente.", "success");
          ["chkPelado", "chkEntero", "chkVaso"].forEach(id => { document.getElementById(id).checked = false; });
          ["camposPelado", "camposEntero", "camposVaso"].forEach(id => { document.getElementById(id).style.display = "none"; });
          ["precioPelado", "cantidadPelado", "precioEntero", "cantidadEntero", "precioVaso", "cantidadVaso"].forEach(id => { document.getElementById(id).value = ""; });
          calcularTotalVentaCocos();
          render();
        } else {
          UI.toast(r.mensaje, "error");
        }
      }, `<p class="field-hint">Se descontarán ${totalCocos} cocos del inventario.</p>`);
    });

    // Comprar cocos
    document.getElementById("btnComprarCocos").addEventListener("click", function () {
      const cantidad = parseInt(document.getElementById("compraCantidad").value, 10);
      const costo = parseFloat(document.getElementById("compraCosto").value);
      const desc = document.getElementById("compraDescripcion").value;
      if (!(cantidad > 0)) { UI.toast("Ingresa una cantidad válida mayor a cero.", "error"); return; }
      if (!(costo >= 0)) { UI.toast("Ingresa un costo válido.", "error"); return; }
      const r = App.registrarCompraCocos(cantidad, costo, desc);
      if (r.ok) {
        UI.toast(`✓ Compra registrada. Existencia actual: ${r.existencia} cocos.`, "success");
        document.getElementById("compraCantidad").value = "";
        document.getElementById("compraCosto").value = "";
        document.getElementById("compraDescripcion").value = "";
        render();
      } else {
        UI.toast(r.mensaje, "error");
      }
    });

    // Registrar desecho
    document.getElementById("btnRegistrarDesecho").addEventListener("click", function () {
      const cantidad = parseInt(document.getElementById("desechoCantidad").value, 10);
      const motivo = document.getElementById("desechoMotivo").value;
      if (!(cantidad > 0)) { UI.toast("Ingresa una cantidad válida mayor a cero.", "error"); return; }
      UI.abrirModal({
        titulo: "Confirmar desperdicio",
        html: `<p>Se descontarán <strong>${cantidad}</strong> cocos de la existencia.</p>`,
        confirmText: "Confirmar",
        confirmClass: "btn-danger",
        onConfirm: function () {
          const r = App.registrarDesechoCocos(cantidad, motivo);
          if (r.ok) {
            UI.toast(`✓ Desperdicio registrado. Existencia actual: ${r.existencia} cocos.`, "success");
            document.getElementById("desechoCantidad").value = "";
            document.getElementById("desechoMotivo").value = "";
            render();
          } else {
            UI.toast(r.mensaje, "error");
          }
        }
      });
    });

    // Agregar salida
    document.getElementById("btnAgregarSalidaCocos").addEventListener("click", function () {
      const monto = parseFloat(document.getElementById("cocosMontoSalida").value);
      const desc = document.getElementById("cocosDescSalida").value;
      if (!(monto > 0)) { UI.toast("Ingresa un monto válido mayor a cero.", "error"); return; }
      const r = App.agregarSalidaPendiente(AREA, monto, desc);
      if (r.ok) {
        UI.toast("✓ Salida agregada.", "success");
        document.getElementById("cocosMontoSalida").value = "";
        document.getElementById("cocosDescSalida").value = "";
        render();
      } else {
        UI.toast(r.mensaje, "error");
      }
    });

    // Procesar salidas
    document.getElementById("btnProcesarSalidasCocos").addEventListener("click", function () {
      const datos = App.cargar();
      const total = App.totalSalidasPendientes(datos, AREA);
      if (!(total > 0)) { UI.toast("No hay salidas pendientes para procesar.", "warning"); return; }
      UI.confirmarMonto("Se descontarán del capital", total, function () {
        const r = App.procesarSalidasPendientes(AREA);
        if (r.ok) { UI.toast("✓ Salidas registradas correctamente.", "success"); render(); }
        else { UI.toast(r.mensaje, "error"); }
      });
    });

    // Retiro directo
    document.getElementById("btnRetiroCocos").addEventListener("click", function () {
      const monto = parseFloat(document.getElementById("cocosMontoRetiro").value);
      const desc = document.getElementById("cocosDescRetiro").value;
      if (!(monto > 0)) { UI.toast("Ingresa un monto válido mayor a cero.", "error"); return; }
      UI.confirmarMonto("¿Confirmar retiro?", monto, function () {
        const r = App.registrarRetiro(AREA, monto, desc);
        if (r.ok) {
          UI.toast("✓ Retiro registrado.", "success");
          document.getElementById("cocosMontoRetiro").value = "";
          document.getElementById("cocosDescRetiro").value = "";
          render();
        } else {
          UI.toast(r.mensaje, "error");
        }
      });
    });
  });
})();
