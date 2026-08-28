using Microsoft.AspNetCore.Mvc;

namespace TiendaLaEsperanza.Controllers
{
    /// <summary>
    /// Sirve la vista de Préstamos entre áreas (nuevo préstamo, deudas
    /// pendientes, pago de deudas). La lógica vive en wwwroot/js/prestamos.js.
    /// </summary>
    public class PrestamoController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
