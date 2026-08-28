using Microsoft.AspNetCore.Mvc;

namespace TiendaLaEsperanza.Controllers
{
    /// <summary>
    /// Sirve la vista de Configuración y respaldo (exportar/importar JSON,
    /// exportar CSV, borrar todos los datos). Lógica en wwwroot/js/backup.js.
    /// </summary>
    public class BackupController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
