using Microsoft.AspNetCore.Mvc;

namespace TiendaLaEsperanza.Controllers
{
    /// <summary>
    /// Sirve la vista del área Cocos (inventario, compras, ventas por
    /// tipo, desperdicio, salidas, retiros e historial).
    /// La lógica vive en wwwroot/js/cocos.js.
    /// </summary>
    public class CocosController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
