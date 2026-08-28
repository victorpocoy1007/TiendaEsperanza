namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Venta diaria única (Tienda o Hielos). Solo se permite un registro
    /// por área y por fecha.
    /// </summary>
    public class Venta
    {
        public string Id { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty; // "Tienda" | "Hielos"
        public decimal Monto { get; set; }
        public string Fecha { get; set; } = string.Empty; // DD/MM/YYYY
        public string Hora { get; set; } = string.Empty;  // HH:MM
    }
}
