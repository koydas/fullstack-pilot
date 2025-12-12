# DotNetService

Un service API en .NET 8 basé sur des contrôleurs qui expose des opérations CRUD pour des projets.
Le stockage est en mémoire pour faciliter les tests locaux.

## Prérequis
- .NET 8 SDK installé localement.

## Lancer le service
```bash
cd dotnet-service
dotnet restore
dotnet run
```

L'API démarre sur `https://localhost:5001` ou `http://localhost:5000` par défaut. La page racine redirige vers Swagger afin d'explorer les routes.

## Endpoints
- `GET /api/projects` – liste tous les projets
- `GET /api/projects/{id}` – récupère un projet par identifiant
- `POST /api/projects` – crée un projet `{ "name": "Titre", "description": "Optionnelle" }`
- `PUT /api/projects/{id}` – met à jour un projet existant
- `DELETE /api/projects/{id}` – supprime un projet

## Exemples de requêtes
Créer un projet :
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Nouveau projet","description":"Démo .NET"}'
```

Mettre à jour un projet :
```bash
curl -X PUT http://localhost:5000/api/projects/<ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"Nom mis à jour","description":"Nouvelle description"}'
```

Supprimer un projet :
```bash
curl -X DELETE http://localhost:5000/api/projects/<ID>
```
