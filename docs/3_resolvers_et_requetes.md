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

Ou pour un type spécifique:

```graphql
{
  __type(name: "User") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

## Authentification et contexte

Dans une application réelle, le contexte est souvent utilisé pour gérer l'authentification:

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Vérifier le token JWT dans les en-têtes
    const token = req.headers.authorization || '';
    const user = getUser(token);
    
    return {
      user,
      db,
      isAuthenticated: !!user
    };
  }
});
```

Puis dans les résolveurs:

```javascript
const resolvers = {
  Query: {
    me: (_, __, { user, isAuthenticated }) => {
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté');
      }
      return user;
    },
    protectedData: (_, __, { isAuthenticated }) => {
      if (!isAuthenticated) {
        throw new Error('Non autorisé');
      }
      return "Données protégées";
    }
  }
};
```

Dans la prochaine section, nous verrons comment utiliser les mutations pour modifier les données.
