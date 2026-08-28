namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Resumen congelado de un día cerrado. El capital y la existencia de
    /// cocos NO se reinician; solo se marca el día como cerrado.
    /// </summary>
    public class CierreDia
    {
        public string Id { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;

        public decimal VentasTienda { get; set; }
        public decimal VentasCocos { get; set; }
        public decimal VentasHielos { get; set; }
        public decimal VentasTotal { get; set; }

        public decimal SalidasTienda { get; set; }
        public decimal SalidasCocos { get; set; }
        public decimal SalidasHielos { get; set; }
        public decimal SalidasTotal { get; set; }

        public decimal RetirosTotal { get; set; }
        public decimal PrestamosRecibidos { get; set; }
        public decimal PrestamosRealizados { get; set; }

        public int CocosComprados { get; set; }
        public int CocosVendidos { get; set; }
        public int CocosDesechados { get; set; }
        public int CocosExistencia { get; set; }

        public decimal ResultadoNeto { get; set; }
        public decimal CapitalFinal { get; set; }
    }
}
