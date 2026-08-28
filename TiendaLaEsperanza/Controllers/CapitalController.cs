using Microsoft.AspNetCore.Mvc;

namespace TiendaLaEsperanza.Controllers
{
    /// <summary>
    /// Sirve la vista de Capital general, historial completo con filtros
    /// y cierre del día. La lógica vive en wwwroot/js/capital.js.
    /// </summary>
    public class CapitalController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
