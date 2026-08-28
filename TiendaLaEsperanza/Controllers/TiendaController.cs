using Microsoft.AspNetCore.Mvc;

namespace TiendaLaEsperanza.Controllers
{
    /// <summary>
    /// Sirve la vista del área Tienda (venta diaria, salidas, retiros,
    /// resumen e historial). La lógica vive en wwwroot/js/tienda.js.
    /// </summary>
    public class TiendaController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
