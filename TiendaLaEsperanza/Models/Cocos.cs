namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Representa el estado agregado del área Cocos, incluyendo el
    /// inventario físico calculado a partir del historial de movimientos.
    /// </summary>
    public class Cocos
    {
        public int ExistenciaActual { get; set; }
        public int TotalComprados { get; set; }
        public int TotalVendidos { get; set; }
        public int TotalDesechados { get; set; }
        public decimal GastoTotalCompras { get; set; }
        public decimal VentasDelDia { get; set; }
        public decimal SalidasPendientes { get; set; }
    }
}
