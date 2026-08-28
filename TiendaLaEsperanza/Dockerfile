FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /App

# Copiar archivos del proyecto y restaurar dependencias
COPY . ./
RUN dotnet restore

# Compilar y publicar el proyecto
RUN dotnet publish -c Release -o out

# Crear la imagen final de ejecución
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /App
COPY --from=build-env /App/out .
ENTRYPOINT ["dotnet", "TiendaLaEsperanza.dll"]
