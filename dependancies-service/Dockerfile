FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY DependanciesService.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out ./
ENV ASPNETCORE_URLS=http://+:6000
EXPOSE 6000
ENTRYPOINT ["dotnet", "DependanciesService.dll"]
