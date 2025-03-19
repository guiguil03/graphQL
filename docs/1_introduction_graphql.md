# Introduction à GraphQL

## Qu'est-ce que GraphQL ?

GraphQL est un langage de requête pour les API et un runtime côté serveur pour exécuter ces requêtes. Développé par Facebook en 2012 et rendu open-source en 2015, GraphQL offre une alternative puissante aux API REST traditionnelles.

## Pourquoi GraphQL ?

### Problèmes avec REST

Les API REST présentent plusieurs limitations :

- **Over-fetching** : Récupération de plus de données que nécessaire
- **Under-fetching** : Nécessité de faire plusieurs requêtes pour obtenir toutes les données
- **Points d'accès multiples** : Une API REST typique expose plusieurs endpoints (/users, /posts, etc.)
- **Versionnement complexe** : La gestion des versions peut devenir compliquée

### Avantages de GraphQL

GraphQL résout ces problèmes en offrant :

- **Un seul endpoint** : Toutes les requêtes passent par un seul point d'accès
- **Requêtes précises** : Le client spécifie exactement les données dont il a besoin
- **Introspection** : L'API est auto-documentée
- **Type fort** : Le schéma définit clairement les types de données
- **Évolution sans versions** : Ajout de champs sans casser les clients existants

## Concepts de base

### 1. Schéma

Le schéma définit la structure de vos données et les opérations disponibles :

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}
```

### 2. Types d'opérations

GraphQL supporte trois types d'opérations principales :

- **Query** : Pour récupérer des données (équivalent à GET en REST)
- **Mutation** : Pour modifier des données (équivalent à POST, PUT, DELETE en REST)
- **Subscription** : Pour établir des connexions en temps réel

### 3. Résolveurs

Les résolveurs sont des fonctions qui déterminent comment les données sont récupérées ou modifiées :

```javascript
const resolvers = {
  Query: {
    user: (parent, args, context) => {
      return database.getUser(args.id);
    }
  }
};
```

## Comparaison avec REST

| Caractéristique | REST | GraphQL |
|-----------------|------|---------|
| Points d'accès | Multiples endpoints (/users, /posts) | Un seul endpoint |
| Structure de requête | Définie par le serveur | Définie par le client |
| Quantité de données | Fixe (over/under-fetching) | Précise (ce qui est demandé) |
| Versionnement | Explicite (v1, v2) | Évolutif sans versions |
| Mise en cache | Facile (basée sur les URL) | Plus complexe |
| Documentation | Externe (Swagger, etc.) | Auto-documentée |

## Outils GraphQL populaires

- **Apollo Server/Client** : Bibliothèque complète pour serveur et client
- **Express-GraphQL** : Intégration avec Express.js
- **GraphiQL** : Interface graphique pour tester les requêtes
- **Playground** : Alternative à GraphiQL avec plus de fonctionnalités
- **Prisma** : ORM compatible avec GraphQL

## Conclusion

GraphQL représente une évolution majeure dans la conception des API, offrant plus de flexibilité et d'efficacité que les approches traditionnelles comme REST. Sa capacité à permettre aux clients de spécifier exactement les données dont ils ont besoin réduit la quantité de données transférées et le nombre de requêtes nécessaires.
