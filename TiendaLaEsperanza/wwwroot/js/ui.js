/* ============================================================
   ui.js
   Utilidades de interfaz compartidas: menú lateral, fecha en la
   barra superior, resaltado de navegación inferior, modales de
   confirmación y mensajes tipo toast.
   ============================================================ */

(function (window) {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const fechaEl = document.getElementById("topbarFecha");
    if (fechaEl) fechaEl.textContent = App.fechaHoy();

    // Menú lateral
    const btnMenu = document.getElementById("btnMenu");
    const btnCerrar = document.getElementById("btnCerrarMenu");
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("sideMenuOverlay");
    function abrirMenu() { sideMenu.classList.add("open"); overlay.classList.add("open"); }
    function cerrarMenu() { sideMenu.classList.remove("open"); overlay.classList.remove("open"); }
    if (btnMenu) btnMenu.addEventListener("click", abrirMenu);
    if (btnCerrar) btnCerrar.addEventListener("click", cerrarMenu);
    if (overlay) overlay.addEventListener("click", cerrarMenu);

    // Resaltar item activo en navegación inferior según data-page-actual del body
    const activo = document.body.getAttribute("data-page");
    if (activo) {
      document.querySelectorAll(".bottom-nav-item[data-page]").forEach(a => {
        if (a.getAttribute("data-page") === activo) a.classList.add("active");
      });
    }
  });

  // ---------- Toast ----------

  function toast(mensaje, tipo) {
    const cont = document.getElementById("toastContainer");
    if (!cont) { alert(mensaje); return; }
    const el = document.createElement("div");
    el.className = "toast" + (tipo ? " toast-" + tipo : "");
    el.textContent = mensaje;
    cont.appendChild(el);
    setTimeout(() => { el.remove(); }, 2600);
  }

  // ---------- Modal genérico ----------
  // options.html: contenido HTML del cuerpo
  // options.confirmText / cancelText
  // options.onConfirm: callback ejecutado al confirmar
  // options.confirmClass: clase del botón confirmar (btn-primary, btn-danger, etc.)

  function abrirModal(options) {
    const overlay = document.getElementById("modalOverlay");
    const box = document.getElementById("modalBox");
    if (!overlay || !box) return;

    box.innerHTML = `
      <h3 class="modal-title">${options.titulo || ""}</h3>
      <div class="modal-body">${options.html || ""}</div>
      <div class="btn-row" style="margin-top:16px;">
        <button type="button" class="btn btn-secondary" id="modalBtnCancelar">${options.cancelText || "Cancelar"}</button>
        <button type="button" class="btn ${options.confirmClass || "btn-primary"}" id="modalBtnConfirmar">${options.confirmText || "Confirmar"}</button>
      </div>
    `;
    overlay.classList.add("open");

    function cerrar() {
      overlay.classList.remove("open");
      overlay.removeEventListener("click", overlayClick);
    }
    function overlayClick(e) {
      if (e.target === overlay) cerrar();
    }
    overlay.addEventListener("click", overlayClick);

    document.getElementById("modalBtnCancelar").addEventListener("click", function () {
      cerrar();
      if (options.onCancel) options.onCancel();
    });
    document.getElementById("modalBtnConfirmar").addEventListener("click", function () {
      cerrar();
      if (options.onConfirm) options.onConfirm();
    });
  }

  function cerrarModal() {
    const overlay = document.getElementById("modalOverlay");
    if (overlay) overlay.classList.remove("open");
  }

  // ---------- Confirmación simple de monto ----------

  function confirmarMonto(titulo, monto, onConfirm, extraHtml) {
    abrirModal({
      titulo: titulo,
      html: `<div class="modal-amount">${App.formatoMoneda(monto)}</div>${extraHtml || ""}`,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      onConfirm: onConfirm
    });
  }

  window.UI = {
    toast,
    abrirModal,
    cerrarModal,
    confirmarMonto
  };

})(window);
