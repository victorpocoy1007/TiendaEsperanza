namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Retiro directo de dinero del capital, disponible a cualquier hora.
    /// </summary>
    public class Retiro
    {
        public string Id { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty; // "Tienda" | "Cocos" | "Hielos"
        public decimal Monto { get; set; }
        public string? Descripcion { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
    }
}
