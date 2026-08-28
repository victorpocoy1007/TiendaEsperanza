namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Entrada del historial de movimientos de inventario de cocos.
    /// La existencia se calcula a partir de estos movimientos:
    /// compras - ventas - desechos (nunca negativa).
    /// </summary>
    public class MovimientoCocos
    {
        public string Id { get; set; } = string.Empty;
        public string TipoMovimiento { get; set; } = string.Empty; // COMPRA | VENTA | DESECHO
        public int Cantidad { get; set; }
        public decimal? Costo { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }
}
