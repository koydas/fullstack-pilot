# SQL Server local runner

A lightweight Microsoft SQL Server setup for local development. It parallels the MongoDB helper under `databases/mongo-db` but targets MSSQL instead.

## Prérequis
- Docker Desktop ou Docker Engine avec le plugin Compose installé.

## Construire l'image localement
Depuis la racine du dépôt :

```bash
docker build -t fullstack-pilot-mssql:latest databases/mssql
```

## Lancer le conteneur
Vous pouvez démarrer le conteneur avec `docker run` ou l'intégrer dans un fichier Compose. Exemple rapide :

```bash
docker run -d \
  --name fullstack-pilot-mssql \
  -e ACCEPT_EULA=Y \
  -e MSSQL_PID=Developer \
  -e MSSQL_SA_PASSWORD=YourStrong!Passw0rd \
  -p 1433:1433 \
  -v $(pwd)/databases/mssql/data:/var/opt/mssql \
  fullstack-pilot-mssql:latest
```

La base écoute sur `localhost:1433` avec l'utilisateur `sa` et le mot de passe défini par `MSSQL_SA_PASSWORD` (valeur par défaut : `YourStrong!Passw0rd`).

## Arrêter la base de données
```bash
docker stop fullstack-pilot-mssql && docker rm fullstack-pilot-mssql
```

## Persistance des données
- Les données sont stockées dans `databases/mssql/data` et persistent entre les redémarrages.
- Modifiez la variable `MSSQL_SA_PASSWORD` si vous souhaitez un mot de passe différent pour l'utilisateur `sa`.
