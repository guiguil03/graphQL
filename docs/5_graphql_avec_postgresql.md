# GraphQL avec PostgreSQL

Ce guide explique comment intégrer efficacement GraphQL avec une base de données PostgreSQL.

## Connexion à PostgreSQL

### Configuration de base

Commencez par installer les dépendances nécessaires :

```bash
npm install pg pg-pool dotenv
```

Créez un fichier `.env` pour stocker vos informations de connexion :

```
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
```

Créez un module de connexion à la base de données :

```javascript
// db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Fonction utilitaire pour exécuter des requêtes
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
};

module.exports = { query };
```

## Schéma de base de données PostgreSQL

Voici un exemple de schéma SQL pour une application de blog :

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT false,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Schéma GraphQL correspondant

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  comments: [Comment!]!
  createdAt: String!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  comments: [Comment!]!
  createdAt: String!
  updatedAt: String
}

type Comment {
  id: ID!
  text: String!
  post: Post!
  user: User!
  createdAt: String!
}

type Query {
  user(id: ID!): User
  users: [User!]!
  post(id: ID!): Post
  posts(published: Boolean): [Post!]!
  comments(postId: ID!): [Comment!]!
}

type Mutation {
  createUser(name: String!, email: String!, password: String!): User!
  createPost(title: String!, content: String!, published: Boolean, authorId: ID!): Post!
  updatePost(id: ID!, title: String, content: String, published: Boolean): Post!
  deletePost(id: ID!): Post
  createComment(text: String!, postId: ID!, userId: ID!): Comment!
}
```

## Resolvers avec PostgreSQL

### Requêtes

```javascript
const resolvers = {
  Query: {
    user: async (_, { id }, { db }) => {
      const users = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return users[0];
    },
    
    users: async (_, __, { db }) => {
      return await db.query('SELECT * FROM users ORDER BY name');
    },
    
    post: async (_, { id }, { db }) => {
      const posts = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
      return posts[0];
    },
    
    posts: async (_, { published }, { db }) => {
      let queryText = 'SELECT * FROM posts';
      const queryParams = [];
      
      if (published !== undefined) {
        queryText += ' WHERE published = $1';
        queryParams.push(published);
      }
      
      queryText += ' ORDER BY created_at DESC';
      return await db.query(queryText, queryParams);
    },
    
    comments: async (_, { postId }, { db }) => {
      return await db.query(
        'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC',
        [postId]
      );
    }
  }
};
```

### Relations

```javascript
const resolvers = {
  // ... Requêtes précédentes
  
  User: {
    posts: async (parent, _, { db }) => {
      return await db.query(
        'SELECT * FROM posts WHERE author_id = $1 ORDER BY created_at DESC',
        [parent.id]
      );
    },
    
    comments: async (parent, _, { db }) => {
      return await db.query(
        'SELECT * FROM comments WHERE user_id = $1 ORDER BY created_at DESC',
        [parent.id]
      );
    }
  },
  
  Post: {
    author: async (parent, _, { db }) => {
      const users = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [parent.author_id]
      );
      return users[0];
    },
    
    comments: async (parent, _, { db }) => {
      return await db.query(
        'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC',
        [parent.id]
      );
    }
  },
  
  Comment: {
    user: async (parent, _, { db }) => {
      const users = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [parent.user_id]
      );
      return users[0];
    },
    
    post: async (parent, _, { db }) => {
      const posts = await db.query(
        'SELECT * FROM posts WHERE id = $1',
        [parent.post_id]
      );
      return posts[0];
    }
  }
};
```

### Mutations

```javascript
const resolvers = {
  // ... Requêtes et relations précédentes
  
  Mutation: {
    createUser: async (_, { name, email, password }, { db }) => {
      // En production, hachez le mot de passe avant de l'enregistrer
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await db.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        [name, email, hashedPassword]
      );
      
      return result[0];
    },
    
    createPost: async (_, { title, content, published = false, authorId }, { db }) => {
      const result = await db.query(
        'INSERT INTO posts (title, content, published, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, content, published, authorId]
      );
      
      return result[0];
    },
    
    updatePost: async (_, { id, title, content, published }, { db }) => {
      // Construire dynamiquement la requête de mise à jour
      let updates = [];
      let queryParams = [];
      let paramCounter = 1;
      
      if (title !== undefined) {
        updates.push(`title = $${paramCounter++}`);
        queryParams.push(title);
      }
      
      if (content !== undefined) {
        updates.push(`content = $${paramCounter++}`);
        queryParams.push(content);
      }
      
      if (published !== undefined) {
        updates.push(`published = $${paramCounter++}`);
        queryParams.push(published);
      }
      
      // Ajouter updated_at à la mise à jour
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Ajouter l'ID comme dernier paramètre
      queryParams.push(id);
      
      const query = `
        UPDATE posts 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;
      
      const result = await db.query(query, queryParams);
      
      if (result.length === 0) {
        throw new Error(`Post avec l'ID ${id} non trouvé`);
      }
      
      return result[0];
    },
    
    deletePost: async (_, { id }, { db }) => {
      // Récupérer le post avant de le supprimer
      const post = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
      
      if (post.length === 0) {
        throw new Error(`Post avec l'ID ${id} non trouvé`);
      }
      
      await db.query('DELETE FROM posts WHERE id = $1', [id]);
      
      return post[0];
    },
    
    createComment: async (_, { text, postId, userId }, { db }) => {
      const result = await db.query(
        'INSERT INTO comments (text, post_id, user_id) VALUES ($1, $2, $3) RETURNING *',
        [text, postId, userId]
      );
      
      return result[0];
    }
  }
};
```

## Optimisation avec DataLoader

Le problème N+1 est particulièrement important avec les bases de données SQL. DataLoader peut aider à résoudre ce problème :

```javascript
const DataLoader = require('dataloader');
const { query } = require('./db');

// Créer les fonctions de chargement par lots
const batchGetUsersByIds = async (ids) => {
  const users = await query(
    'SELECT * FROM users WHERE id = ANY($1::int[])',
    [ids]
  );
  
  // Mapper les résultats dans le même ordre que les ids
  return ids.map(id => users.find(user => user.id === parseInt(id)) || null);
};

const batchGetPostsByAuthorIds = async (authorIds) => {
  const posts = await query(
    'SELECT * FROM posts WHERE author_id = ANY($1::int[])',
    [authorIds]
  );
  
  // Regrouper les posts par author_id
  const postsByAuthorId = posts.reduce((acc, post) => {
    acc[post.author_id] = acc[post.author_id] || [];
    acc[post.author_id].push(post);
    return acc;
  }, {});
  
  // Retourner les posts pour chaque author_id
  return authorIds.map(authorId => postsByAuthorId[authorId] || []);
};

// Créer les DataLoaders
const createLoaders = () => ({
  userById: new DataLoader(batchGetUsersByIds),
  postsByAuthorId: new DataLoader(batchGetPostsByAuthorIds)
});

// Utiliser les loaders dans les resolvers
const resolvers = {
  Post: {
    author: async (post, _, { loaders }) => {
      return loaders.userById.load(post.author_id);
    }
  },
  User: {
    posts: async (user, _, { loaders }) => {
      return loaders.postsByAuthorId.load(user.id);
    }
  }
};

// Dans le contexte du serveur Apollo
const context = async ({ req }) => {
  return {
    db: { query },
    loaders: createLoaders()
  };
};
```

## Transactions

Pour les opérations qui nécessitent l'atomicité (comme la création d'un utilisateur et de son premier post en même temps), utilisez des transactions PostgreSQL :

```javascript
const executeTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Dans un resolver
const resolvers = {
  Mutation: {
    createUserWithPost: async (_, { userData, postData }, { db }) => {
      return executeTransaction(async (client) => {
        // Insérer l'utilisateur
        const userResult = await client.query(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
          [userData.name, userData.email, userData.password]
        );
        
        const user = userResult.rows[0];
        
        // Insérer le post
        const postResult = await client.query(
          'INSERT INTO posts (title, content, published, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
          [postData.title, postData.content, postData.published, user.id]
        );
        
        const post = postResult.rows[0];
        
        // Retourner les deux objets
        return {
          user,
          post
        };
      });
    }
  }
};
```

## Pagination avec curseur

La pagination basée sur les curseurs est recommandée pour les grandes collections :

```javascript
// Dans le schéma GraphQL
const typeDefs = gql`
  type Query {
    posts(first: Int, after: String): PostConnection!
  }
  
  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
  }
  
  type PostEdge {
    node: Post!
    cursor: String!
  }
  
  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }
`;

// Dans les resolvers
const resolvers = {
  Query: {
    posts: async (_, { first = 10, after }, { db }) => {
      let queryText = 'SELECT * FROM posts';
      const queryParams = [];
      let paramCounter = 1;
      
      if (after) {
        // Décoder le curseur (dans cet exemple, le curseur est juste l'ID encodé en base64)
        const decodedCursor = Buffer.from(after, 'base64').toString('ascii');
        queryText += ` WHERE id > $${paramCounter++}`;
        queryParams.push(decodedCursor);
      }
      
      queryText += ` ORDER BY id LIMIT $${paramCounter}`;
      queryParams.push(first + 1);  // Demander un de plus pour vérifier hasNextPage
      
      const posts = await db.query(queryText, queryParams);
      
      // Déterminer s'il y a une page suivante
      const hasNextPage = posts.length > first;
      const edges = posts.slice(0, first).map(post => ({
        node: post,
        cursor: Buffer.from(post.id.toString()).toString('base64')
      }));
      
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length > 0
            ? edges[edges.length - 1].cursor
            : null
        }
      };
    }
  }
};
```

## Migrations et gestion de schéma

Pour gérer l'évolution de votre schéma de base de données, utilisez un outil de migration comme node-pg-migrate :

```bash
npm install node-pg-migrate pg
```

Créez un script de migration :

```javascript
// migrations/1615000000000_initial-schema.js
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(100)', notNull: true, unique: true },
    password: { type: 'varchar(100)', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });
  
  pgm.createTable('posts', {
    id: 'id',
    title: { type: 'varchar(255)', notNull: true },
    content: { type: 'text', notNull: true },
    published: { type: 'boolean', notNull: true, default: false },
    author_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: { type: 'timestamp' }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('posts');
  pgm.dropTable('users');
};
```

Exécutez les migrations :

```bash
npx node-pg-migrate up
```

## Conclusion

L'intégration de GraphQL avec PostgreSQL offre une solution puissante et flexible pour développer des API modernes. Les points clés à retenir sont :

1. Utilisez des requêtes paramétrées pour éviter les injections SQL
2. Optimisez les performances avec DataLoader pour résoudre le problème N+1
3. Utilisez des transactions pour les opérations atomiques
4. Implémentez la pagination basée sur les curseurs pour les grandes collections
5. Gérez l'évolution de votre schéma avec des outils de migration

Cette approche vous permet de combiner la flexibilité de GraphQL avec la puissance et la fiabilité de PostgreSQL, tout en maintenant de bonnes performances et une structure de code propre et maintenable.
