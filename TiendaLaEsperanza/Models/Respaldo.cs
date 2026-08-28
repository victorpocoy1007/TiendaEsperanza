namespace TiendaLaEsperanza.Models
{
    /// <summary>
    /// Metadatos de un respaldo (backup) exportado a JSON. El contenido
    /// completo de los datos se genera en el cliente (ver backup.js);
    /// esta clase documenta el sobre ("envelope") del archivo exportado.
    /// </summary>
    public class Respaldo
    {
        public string Version { get; set; } = "1.0";
        public string FechaExportacion { get; set; } = string.Empty;
        public string HoraExportacion { get; set; } = string.Empty;
        public string NombreArchivo { get; set; } = string.Empty; // backup-tienda-la-esperanza-YYYY-MM-DD.json
        public object? Datos { get; set; }
    }
}
