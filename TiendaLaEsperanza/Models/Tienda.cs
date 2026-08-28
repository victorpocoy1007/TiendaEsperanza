namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Representa el estado agregado del área Tienda.
    /// Los datos reales viven en localStorage (ver wwwroot/js/storage.js);
    /// esta clase documenta la forma de esos datos y sirve como referencia
    /// para una futura migración a base de datos.
    /// </summary>
    public class Tienda
    {
        public decimal VentaDelDia { get; set; }
        public bool VentaRegistradaHoy { get; set; }
        public decimal TotalSalidasPendientes { get; set; }
        public decimal TotalSalidasProcesadas { get; set; }
        public decimal TotalRetiros { get; set; }
    }
}
