/* ============================================================
   backup.js — Exportación/importación JSON, exportación CSV
   y borrado total de datos.
   ============================================================ */

(function () {
  "use strict";

  function descargarArchivo(nombre, contenido, tipoMime) {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("btnExportarJSON").addEventListener("click", function () {
      const envelope = App.exportarJSON();
      descargarArchivo(App.nombreArchivoBackup(), JSON.stringify(envelope, null, 2), "application/json");
      UI.toast("✓ Respaldo exportado correctamente.", "success");
    });

    document.getElementById("btnImportarJSON").addEventListener("click", function () {
      document.getElementById("inputImportarJSON").click();
    });

    document.getElementById("inputImportarJSON").addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        let obj;
        try {
          obj = JSON.parse(ev.target.result);
        } catch (err) {
          UI.toast("El archivo seleccionado no es un JSON válido.", "error");
          e.target.value = "";
          return;
        }
        if (!App.validarEstructuraBackup(obj)) {
          UI.toast("El archivo no tiene una estructura válida de respaldo.", "error");
          e.target.value = "";
          return;
        }
        UI.abrirModal({
          titulo: "Importar respaldo",
          html: "<p>Esto reemplazará la información actual almacenada en este dispositivo. Esta acción no se puede deshacer.</p>",
          confirmText: "Importar",
          confirmClass: "btn-danger",
          onConfirm: function () {
            const r = App.importarJSON(obj);
            if (r.ok) { UI.toast("✓ Respaldo importado correctamente.", "success"); }
            else { UI.toast(r.mensaje, "error"); }
            e.target.value = "";
          },
          onCancel: function () { e.target.value = ""; }
        });
      };
      reader.readAsText(file);
    });

    document.getElementById("btnExportarCSV").addEventListener("click", function () {
      const tipo = document.getElementById("csvTipo").value;
      const csv = App.exportarCSV(tipo);
      descargarArchivo(`reporte-${tipo}-${App.fechaHoy().replace(/\//g, "-")}.csv`, csv, "text/csv;charset=utf-8;");
      UI.toast("✓ CSV exportado correctamente.", "success");
    });

    document.getElementById("btnBorrarTodo").addEventListener("click", function () {
      UI.abrirModal({
        titulo: "¿Borrar todos los datos?",
        html: "<p>Se eliminará permanentemente toda la información: ventas, salidas, retiros, préstamos, inventario de cocos e historial. Esta acción no se puede deshacer.</p><p class=\"field-hint\">Se recomienda exportar un respaldo JSON antes de continuar.</p>",
        confirmText: "Borrar todo",
        confirmClass: "btn-danger",
        onConfirm: function () {
          App.borrarTodosLosDatos();
          UI.toast("✓ Todos los datos fueron borrados.", "success");
        }
      });
    });
  });
})();
