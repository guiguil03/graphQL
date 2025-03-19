# 3. Résolveurs et Requêtes

## Les Résolveurs

Les résolveurs sont des fonctions qui déterminent comment les données pour un champ sont récupérées ou calculées. Ils sont la partie "implémentation" de votre API GraphQL.

### Structure de base d'un résolveur

Un résolveur a la signature suivante:

```javascript
fieldName: (parent, args, context, info) => {
  // Code pour résoudre le champ
}
```

Où:
- `parent`: L'objet parent qui contient ce champ
- `args`: Les arguments passés à ce champ dans la requête
- `context`: Un objet partagé entre tous les résolveurs, souvent utilisé pour l'authentification, les connexions DB, etc.
- `info`: Contient des informations sur la requête actuelle, comme le nom du champ, le chemin, etc.

### Exemple de résolveurs

```javascript
const resolvers = {
  Query: {
    user: (_, { id }, { db }) => {
      return db.users.find(user => user.id === id);
    },
    users: (_, __, { db }) => {
      return db.users;
    }
  },
  User: {
    posts: (parent, _, { db }) => {
      return db.posts.filter(post => post.authorId === parent.id);
    }
  },
  Mutation: {
    createUser: (_, { input }, { db }) => {
      const newUser = {
        id: String(db.users.length + 1),
        ...input,
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      return newUser;
    }
  }
};
```

## Requêtes GraphQL

Les requêtes GraphQL sont le moyen par lequel les clients demandent des données au serveur.

### Structure d'une requête

Une requête GraphQL de base ressemble à ceci:

```graphql
{
  user(id: "1") {
    name
    email
    posts {
      title
      comments {
        text
      }
    }
  }
}
```

### Nommage des requêtes

Il est possible de nommer les requêtes pour une meilleure lisibilité et pour aider au débogage:

```graphql
query GetUserWithPosts {
  user(id: "1") {
    name
    email
    posts {
      title
    }
  }
}
```

### Variables

Pour rendre les requêtes réutilisables, on utilise des variables:

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
  }
}
```

Variables JSON:
```json
{
  "id": "1"
}
```

### Fragments

Les fragments permettent de réutiliser des morceaux de requêtes:

```graphql
fragment UserBasic on User {
  id
  name
  email
}

query GetUsers {
  users {
    ...UserBasic
    posts {
      title
    }
  }
}

query GetUser($id: ID!) {
  user(id: $id) {
    ...UserBasic
    createdAt
  }
}
```

### Directives de requête

GraphQL inclut des directives qui peuvent être utilisées dans les requêtes:

```graphql
query GetUserData($id: ID!, $withPosts: Boolean!) {
  user(id: $id) {
    name
    email
    posts @include(if: $withPosts) {
      title
    }
    phoneNumber @skip(if: $withPosts)
  }
}
```

Variables:
```json
{
  "id": "1",
  "withPosts": true
}
```

### Alias

Les alias permettent de renommer les champs dans la réponse:

```graphql
{
  activeUser: user(id: "1") {
    name
  }
  inactiveUser: user(id: "2") {
    name
  }
}
```

Réponse:
```json
{
  "data": {
    "activeUser": {
      "name": "John Doe"
    },
    "inactiveUser": {
      "name": "Jane Smith"
    }
  }
}
```

## Requêtes d'introspection

GraphQL permet d'interroger le schéma lui-même (introspection):

```graphql
{
  __schema {
    types {
      name
      kind
      description
    }
  }
}
```

Pour obtenir les détails d'un type spécifique:

```graphql
{
  __type(name: "User") {
    name
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}
```

## Mutations

Les mutations sont utilisées pour modifier des données:

```graphql
mutation CreateNewUser {
  createUser(input: {
    name: "John Doe",
    email: "john@example.com",
    age: 30
  }) {
    id
    name
    email
  }
}
```

### Mutations multiples

Vous pouvez exécuter plusieurs mutations dans une seule requête:

```graphql
mutation ManageUsers {
  createUser(input: { name: "Alice", email: "alice@example.com" }) {
    id
    name
  }
  
  updateUser(id: "1", input: { name: "Bob Updated" }) {
    id
    name
  }
}
```

Important: Les mutations s'exécutent séquentiellement, contrairement aux requêtes qui peuvent s'exécuter en parallèle.

## Subscriptions

Les subscriptions permettent de recevoir des mises à jour en temps réel:

```graphql
subscription {
  newPost {
    id
    title
    author {
      name
    }
  }
}
```

## Bonnes pratiques pour les requêtes et resolvers

### Requêtes

1. **Nommez vos opérations** : Donnez des noms significatifs à vos requêtes et mutations
2. **Utilisez des fragments** : Pour éviter la duplication de code
3. **Limitez la profondeur** : Évitez les requêtes trop profondes qui pourraient surcharger le serveur
4. **Pagination** : Utilisez la pagination pour les grandes collections

### Resolvers

1. **Gardez-les simples** : Chaque resolver doit faire une seule chose
2. **Évitez le problème N+1** : Utilisez des solutions comme DataLoader pour optimiser les requêtes en base de données
3. **Gestion des erreurs** : Implémentez une gestion d'erreurs cohérente
4. **Validation** : Validez les entrées utilisateur avant de les traiter
5. **Performances** : Surveillez les performances de vos resolvers et optimisez-les si nécessaire

## Exemple complet

Schéma:

```graphql
type User {
  id: ID!
  name: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}

type Query {
  user(id: ID!): User
  posts: [Post!]!
}

type Mutation {
  createPost(title: String!, content: String!, authorId: ID!): Post!
}
```

Resolvers:

```javascript
const resolvers = {
  Query: {
    user: (_, { id }, { db }) => db.users.find(user => user.id === id),
    posts: (_, __, { db }) => db.posts
  },
  User: {
    posts: (parent, _, { db }) => {
      return db.posts.filter(post => post.authorId === parent.id);
    }
  },
  Post: {
    author: (parent, _, { db }) => {
      return db.users.find(user => user.id === parent.authorId);
    }
  },
  Mutation: {
    createPost: (_, { title, content, authorId }, { db }) => {
      const newPost = {
        id: String(db.posts.length + 1),
        title,
        content,
        authorId
      };
      db.posts.push(newPost);
      return newPost;
    }
  }
};
```

Requête:

```graphql
query GetUserWithPosts {
  user(id: "1") {
    name
    posts {
      title
      content
    }
  }
}
```
