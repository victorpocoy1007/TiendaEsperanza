using Microsoft.AspNetCore.Mvc;

namespace TiendaLaEsperanza.Controllers
{
    /// <summary>
    /// Sirve la vista del área Hielos (venta diaria, salidas, retiros,
    /// resumen e historial). La lógica vive en wwwroot/js/hielos.js.
    /// </summary>
    public class HielosController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
