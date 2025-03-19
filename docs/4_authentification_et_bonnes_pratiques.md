# Authentification et bonnes pratiques GraphQL

## Authentification dans GraphQL

Contrairement à REST, GraphQL n'a pas de mécanisme d'authentification standard intégré. Cependant, il existe plusieurs approches pour implémenter l'authentification.

### 1. Authentification via le contexte

Le contexte GraphQL est un objet partagé entre tous les résolveurs. C'est l'endroit idéal pour stocker les informations d'authentification.

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Extraire le token du header Authorization
    const token = req.headers.authorization || '';
    
    // Vérifier et décoder le token
    const user = getUser(token);
    
    return {
      user,
      isAuthenticated: !!user
    };
  }
});
```

### 2. Protection des resolvers

Utilisez le contexte pour protéger vos resolvers :

```javascript
const resolvers = {
  Query: {
    me: (_, __, { user, isAuthenticated }) => {
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté');
      }
      return user;
    },
    adminData: (_, __, { user, isAuthenticated }) => {
      if (!isAuthenticated || user.role !== 'ADMIN') {
        throw new Error('Accès non autorisé');
      }
      return getAdminData();
    }
  }
};
```

### 3. Directives d'authentification

Vous pouvez créer des directives personnalisées pour l'authentification :

```graphql
directive @auth(requires: Role = USER) on OBJECT | FIELD_DEFINITION

enum Role {
  USER
  ADMIN
}

type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  secretData: String @auth(requires: ADMIN)
}

type Query {
  publicData: String
  userData: String @auth
  adminData: String @auth(requires: ADMIN)
}
```

Implémentation de la directive :

```javascript
const { SchemaDirectiveVisitor } = require('apollo-server');

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(object) {
    this.ensureFieldsWrapped(object);
    object._requiredAuthRole = this.args.requires;
  }
  
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRole = this.args.requires;
  }

  ensureFieldsWrapped(objectType) {
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      
      field.resolve = async function (...args) {
        const [, , context] = args;
        const requiredRole = field._requiredAuthRole || objectType._requiredAuthRole;
        
        if (!requiredRole) {
          return resolve.apply(this, args);
        }
        
        if (!context.user) {
          throw new Error('Non authentifié');
        }
        
        if (requiredRole === 'ADMIN' && context.user.role !== 'ADMIN') {
          throw new Error('Permission insuffisante');
        }
        
        return resolve.apply(this, args);
      };
    });
  }
}
```

## Sécurité dans GraphQL

### 1. Limitation de la complexité des requêtes

Pour éviter les requêtes malveillantes ou trop complexes :

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(5),  // Limite la profondeur à 5 niveaux
    costAnalysis({
      maximumCost: 1000,
      variables: {},
      onComplete: (cost) => {
        console.log(`Coût de la requête: ${cost}`);
      }
    })
  ]
});
```

### 2. Rate limiting

Limitez le nombre de requêtes par utilisateur :

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    {
      async requestDidStart({ context }) {
        if (context.user) {
          const limiter = new RateLimiter({
            id: context.user.id,
            db: redis,
            max: 100,  // 100 requêtes
            duration: 60 * 60  // par heure
          });
          
          const limited = await limiter.check();
          if (limited) {
            throw new Error('Trop de requêtes, veuillez réessayer plus tard');
          }
        }
      }
    }
  ]
});
```

### 3. Protection contre les attaques par introspection

Dans un environnement de production, désactivez les requêtes d'introspection :

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production'
});
```

## Optimisation des performances

### 1. Batching et caching avec DataLoader

Pour éviter le problème N+1 :

```javascript
const DataLoader = require('dataloader');

// Dans le contexte
const context = ({ req }) => {
  return {
    loaders: {
      users: new DataLoader(keys => batchGetUsers(keys)),
      posts: new DataLoader(keys => batchGetPosts(keys))
    }
  };
};

// Dans un resolver
const resolvers = {
  Post: {
    author: (post, _, { loaders }) => {
      return loaders.users.load(post.authorId);
    }
  },
  User: {
    posts: (user, _, { loaders }) => {
      return loaders.posts.loadMany(user.postIds);
    }
  }
};
```

### 2. Pagination et chunking

Pour les grandes collections de données :

```graphql
type Query {
  users(first: Int, after: String): UserConnection!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

Implémentation :

```javascript
const resolvers = {
  Query: {
    users: async (_, { first = 10, after }, { db }) => {
      let afterIndex = 0;
      const allUsers = await db.users.findAll();
      
      if (after) {
        const index = allUsers.findIndex(user => user.id === after);
        if (index !== -1) {
          afterIndex = index + 1;
        }
      }
      
      const slicedUsers = allUsers.slice(afterIndex, afterIndex + first);
      const edges = slicedUsers.map(user => ({
        node: user,
        cursor: user.id
      }));
      
      const hasNextPage = allUsers.length > afterIndex + first;
      
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        }
      };
    }
  }
};
```

## Structure du projet GraphQL

### 1. Organisation modulaire

Pour les grands projets, organisez vos schémas et résolveurs par domaine :

```
/src
  /schema
    /user
      typeDefs.js
      resolvers.js
    /post
      typeDefs.js
      resolvers.js
    index.js
  /models
    User.js
    Post.js
  /utils
    auth.js
    dataLoaders.js
  server.js
```

### 2. Schéma modulaire

Combinaison des schémas :

```javascript
// schema/index.js
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { merge } = require('lodash');

const userTypeDefs = require('./user/typeDefs');
const userResolvers = require('./user/resolvers');
const postTypeDefs = require('./post/typeDefs');
const postResolvers = require('./post/resolvers');

const schema = makeExecutableSchema({
  typeDefs: [userTypeDefs, postTypeDefs],
  resolvers: merge(userResolvers, postResolvers)
});

module.exports = schema;
```

## Gestion des erreurs

### 1. Erreurs formatées

```javascript
const { ApolloError, UserInputError } = require('apollo-server');

const resolvers = {
  Mutation: {
    createUser: async (_, { input }, { db }) => {
      try {
        // Validation
        if (!input.email.includes('@')) {
          throw new UserInputError('Email invalide', {
            invalidArgs: ['email']
          });
        }
        
        // Vérification de l'unicité
        const existingUser = await db.users.findByEmail(input.email);
        if (existingUser) {
          throw new ApolloError('Email déjà utilisé', 'EMAIL_EXISTS');
        }
        
        // Création
        return db.users.create(input);
      } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        throw error;
      }
    }
  }
};
```

### 2. Formatage des erreurs

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    // Ne pas révéler de détails sensibles en production
    if (process.env.NODE_ENV === 'production') {
      if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return new Error('Erreur interne du serveur');
      }
    }
    
    // Journalisation des erreurs
    console.error(error);
    
    return error;
  }
});
```

## Tests

### 1. Tests unitaires des resolvers

```javascript
const { createTestClient } = require('apollo-server-testing');
const { ApolloServer } = require('apollo-server');
const resolvers = require('./resolvers');
const typeDefs = require('./typeDefs');

describe('User Resolvers', () => {
  it('should get a user by ID', async () => {
    const mockDb = {
      users: [
        { id: '1', name: 'John Doe', email: 'john@example.com' }
      ]
    };
    
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: () => ({ db: mockDb })
    });
    
    const { query } = createTestClient(server);
    
    const GET_USER = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
        }
      }
    `;
    
    const res = await query({
      query: GET_USER,
      variables: { id: '1' }
    });
    
    expect(res.data.user).toEqual({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    });
  });
});
```

## Conclusion

L'authentification et la sécurité sont des aspects essentiels de toute API GraphQL en production. En suivant ces bonnes pratiques, vous pouvez construire une API robuste, performante et sécurisée.

Les principaux points à retenir sont :

1. Utilisez le contexte pour l'authentification
2. Implémentez des mesures de sécurité comme la limitation de complexité et le rate limiting
3. Optimisez les performances avec DataLoader et la pagination
4. Structurez votre projet de manière modulaire
5. Implémentez une gestion des erreurs cohérente
6. Écrivez des tests pour vos resolvers
