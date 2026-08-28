namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Préstamo de dinero entre las tres áreas del negocio. No afecta el
    /// capital total del negocio, solo redistribuye saldos entre áreas.
    /// </summary>
    public class Prestamo
    {
        public string Id { get; set; } = string.Empty;
        public string AreaOrigen { get; set; } = string.Empty;  // quien presta
        public string AreaDestino { get; set; } = string.Empty; // quien recibe
        public decimal Monto { get; set; }
        public string? Descripcion { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
        public string Estado { get; set; } = "pendiente"; // "pendiente" | "pagado"
        public string? FechaPago { get; set; }
        public string? HoraPago { get; set; }
    }
}
