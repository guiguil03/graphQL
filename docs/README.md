# Documentation GraphQL

Bienvenue dans cette documentation complète sur GraphQL. Ce guide est conçu pour vous aider à comprendre et à maîtriser GraphQL, de la théorie à la pratique.

## Contenu

1. **[Introduction à GraphQL](./1_introduction_graphql.md)**
   - Qu'est-ce que GraphQL ?
   - Pourquoi GraphQL ?
   - Concepts de base
   - Comparaison avec REST

2. **[Schéma et types](./2_schema_et_types.md)**
   - Structure d'un schéma
   - Types d'objets
   - Types scalaires
   - Types racines
   - Types d'entrée
   - Types d'énumération
   - Interfaces et unions
   - Directives

3. **[Resolvers et requêtes](./3_resolvers_et_requetes.md)**
   - Structure de base d'un resolver
   - Exemples de resolvers
   - Structure d'une requête
   - Variables
   - Fragments
   - Directives de requête
   - Alias
   - Requêtes d'introspection
   - Mutations
   - Subscriptions

4. **[Authentification et bonnes pratiques](./4_authentification_et_bonnes_pratiques.md)**
   - Authentification via le contexte
   - Protection des resolvers
   - Directives d'authentification
   - Sécurité dans GraphQL
   - Optimisation des performances
   - Structure du projet
   - Gestion des erreurs
   - Tests

5. **[GraphQL avec PostgreSQL](./5_graphql_avec_postgresql.md)**
   - Connexion à PostgreSQL
   - Schéma de base de données
   - Resolvers avec PostgreSQL
   - Optimisation avec DataLoader
   - Transactions
   - Pagination
   - Migrations

## Comment utiliser cette documentation

Cette documentation est organisée de manière progressive, du plus simple au plus complexe. Il est recommandé de suivre les chapitres dans l'ordre, mais vous pouvez également vous référer directement à une section spécifique si vous avez besoin d'informations sur un sujet particulier.

Chaque chapitre contient des exemples de code pratiques que vous pouvez adapter à vos propres projets.

## Ressources supplémentaires

- [Site officiel de GraphQL](https://graphql.org/)
- [Documentation Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [Documentation Apollo Client](https://www.apollographql.com/docs/react/)
- [GraphQL Playground](https://github.com/graphql/graphql-playground)

## Projet d'exemple

Ce projet contient également une implémentation fonctionnelle d'une API GraphQL avec :
- Un serveur Express avec Apollo Server
- Une connexion à PostgreSQL (Neon Database)
- Des exemples de requêtes et mutations

Pour lancer le serveur :

```bash
node server.js
```

Vous pouvez ensuite accéder à l'interface GraphQL à l'adresse `http://localhost:4000/graphql`.
