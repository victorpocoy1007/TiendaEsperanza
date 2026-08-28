namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Representa el estado agregado del área Hielos.
    /// </summary>
    public class Hielos
    {
        public decimal VentaDelDia { get; set; }
        public bool VentaRegistradaHoy { get; set; }
        public decimal TotalSalidasPendientes { get; set; }
        public decimal TotalSalidasProcesadas { get; set; }
        public decimal TotalRetiros { get; set; }
    }
}
