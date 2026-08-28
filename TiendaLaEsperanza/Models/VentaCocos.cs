namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Detalle de un tipo de coco dentro de una venta (pelado, entero o vaso).
    /// </summary>
    public class DetalleTipoCoco
    {
        public bool Seleccionado { get; set; }
        public decimal Precio { get; set; }
        public int Cantidad { get; set; }
    }

    /// <summary>
    /// Venta de cocos. Puede combinar hasta tres tipos en una sola operación.
    /// El total de unidades se descuenta inmediatamente de la existencia.
    /// </summary>
    public class VentaCocos
    {
        public string Id { get; set; } = string.Empty;
        public DetalleTipoCoco Pelado { get; set; } = new();
        public DetalleTipoCoco Entero { get; set; } = new();
        public DetalleTipoCoco Vaso { get; set; } = new();
        public decimal Total { get; set; }
        public int TotalCocos { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
    }
}
