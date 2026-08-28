namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Entrada del historial general de movimientos de dinero (venta,
    /// salida, retiro, préstamo enviado/recibido, pago de préstamo).
    /// </summary>
    public class MovimientoCapital
    {
        public string Id { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty; // VENTA | SALIDA | RETIRO | PRESTAMO_ENVIADO | PRESTAMO_RECIBIDO | PAGO_PRESTAMO
        public string Area { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? Estado { get; set; }
    }
}
