# Dependancies Service

Un service API en .NET 8 basé sur des contrôleurs qui expose des opérations CRUD pour des projets.
Le stockage est en mémoire pour faciliter les tests locaux.

## Prérequis
- .NET 8 SDK installé localement.

## Lancer le service
```bash
cd dependancies-service
dotnet restore
dotnet run
```

L'API démarre sur `http://localhost:6060` (Swagger est servi à la racine pour explorer les routes).

## Endpoints
- `GET /api/dependancies` – liste tous les projets
- `GET /api/dependancies/{id}` – récupère un projet par identifiant
- `POST /api/dependancies` – crée un projet `{ "name": "Titre", "description": "Optionnelle" }`
- `PUT /api/dependancies/{id}` – met à jour un projet existant
- `DELETE /api/dependancies/{id}` – supprime un projet

## Exemples de requêtes
Créer un projet :
```bash
curl -X POST http://localhost:6060/api/dependancies \
  -H "Content-Type: application/json" \
  -d '{"name":"Nouveau projet","description":"Démo .NET"}'
```

Mettre à jour un projet :
```bash
curl -X PUT http://localhost:6060/api/dependancies/<ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"Nom mis à jour","description":"Nouvelle description"}'
```

Supprimer un projet :
```bash
curl -X DELETE http://localhost:6060/api/dependancies/<ID>
```
