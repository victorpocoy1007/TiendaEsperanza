using Microsoft.AspNetCore.Mvc;

namespace TiendaLaEsperanza.Controllers
{
    /// <summary>
    /// Sirve el Dashboard (inicio). Toda la lógica de datos ocurre en el
    /// cliente contra localStorage (wwwroot/js/storage.js + dashboard.js).
    /// </summary>
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View();
        }
    }
}
