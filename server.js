const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const cors = require("cors");
const prisma = require("./prisma/client");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    createdAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    summary: String
    published: Boolean!
    createdAt: String!
    updatedAt: String
    author: User!
    authorId: Int!
  }

  type Query {
    hello: String
    users: [User!]!
    user(id: ID!): User
    posts(published: Boolean): [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
    createPost(title: String!, content: String!, summary: String, published: Boolean, authorId: Int!): Post!
    updatePost(id: ID!, title: String, content: String, summary: String, published: Boolean): Post!
    deletePost(id: ID!): Post
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL!",
    users: async () => {
      return await prisma.user.findMany();
    },
    user: async (_, { id }) => {
      return await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });
    },
    posts: async (_, { published }) => {
      if (published !== undefined) {
        return await prisma.post.findMany({
          where: { published },
          include: { author: true }
        });
      }
      return await prisma.post.findMany({
        include: { author: true }
      });
    },
    post: async (_, { id }) => {
      return await prisma.post.findUnique({
        where: { id: parseInt(id) },
        include: { author: true }
      });
    }
  },
  Mutation: {
    createUser: async (_, { name, email, password }) => {
      return await prisma.user.create({
        data: {
          name,
          email,
          password // Note: dans une app réelle, le mot de passe devrait être hashé
        }
      });
    },
    createPost: async (_, { title, content, summary, published = false, authorId }) => {
      return await prisma.post.create({
        data: {
          title,
          content,
          summary,
          published,
          authorId
        },
        include: { author: true }
      });
    },
    updatePost: async (_, { id, title, content, summary, published }) => {
      const data = {};
      if (title !== undefined) data.title = title;
      if (content !== undefined) data.content = content;
      if (summary !== undefined) data.summary = summary;
      if (published !== undefined) data.published = published;
      
      return await prisma.post.update({
        where: { id: parseInt(id) },
        data,
        include: { author: true }
      });
    },
    deletePost: async (_, { id }) => {
      return await prisma.post.delete({
        where: { id: parseInt(id) },
        include: { author: true }
      });
    }
  },
  User: {
    posts: async (parent) => {
      return await prisma.post.findMany({
        where: { authorId: parent.id }
      });
    }
  },
  Post: {
    author: async (parent) => {
      if (parent.author) {
        return parent.author;
      }
      return await prisma.user.findUnique({
        where: { id: parent.authorId }
      });
    }
  }
}

const startServer = async () => {
  try {
    const app = express();
    app.use(cors());

    const server = new ApolloServer({ 
      typeDefs, 
      resolvers, 
      introspection: true, 
      playground: true 
    });

    await server.start();
    server.applyMiddleware({ app });

    console.log(" Schéma GraphQL chargé :", server.schema); 

    // Ports à essayer en séquence si un port est déjà utilisé
    const ports = [4000, 4001, 4002, 4003, 5000];
    
    const startListening = (portIndex = 0) => {
      if (portIndex >= ports.length) {
        console.error(" Tous les ports sont occupés. Impossible de démarrer le serveur.");
        return;
      }
      
      const port = ports[portIndex];
      
      const httpServer = app.listen(port, () => {
        console.log(` Serveur GraphQL prêt sur http://localhost:${port}${server.graphqlPath}`);
      });
      
      httpServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(` Port ${port} déjà utilisé, essai avec le port suivant...`);
          httpServer.close();
          startListening(portIndex + 1);
        } else {
          console.error(" Erreur lors du démarrage du serveur:", err);
        }
      });
    };
    
    startListening();
  } catch (error) {
    console.error(" Erreur au démarrage du serveur GraphQL:", error);
  }
};

startServer();
