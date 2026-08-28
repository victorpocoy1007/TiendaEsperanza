namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Salida de dinero pendiente de un área. Se acumulan durante el día
    /// y se procesan (descuentan del capital) mediante una acción explícita.
    /// </summary>
    public class Salida
    {
        public string Id { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty; // "Tienda" | "Cocos" | "Hielos"
        public decimal Monto { get; set; }
        public string? Descripcion { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
        public string Estado { get; set; } = "pendiente"; // "pendiente" | "procesada"
    }
}
