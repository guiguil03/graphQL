const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const cors = require("cors");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    age: Int!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    summary: String
    published: Boolean!
    createdAt: String!
    updatedAt: String
  }

  type Query {
    hello: String
    users: [User]
    posts: [Post]
    postID(id: ID!): [Post]
    postSummary(id: ID!): [Post]
    postContent(id: ID!): [Post]
  }

  type Mutation {
    createPost(
      title: String!,
      content: String!,
      published: Boolean!,
      summary: String,
      createdAt: String!,
      updatedAt: String
    ): Post,
    updatePost(
      id: ID!
      title: String!,
      content: String!,
      published: Boolean!,
      summary: String,
      createdAt: String!,
      updatedAt: String
    ): Post
    deletePost(id: ID!): Post
  }
  
  
`

const users = [
  { id: "1", name: "Guigui", age: 25 },
  { id: "2", name: "Test", age: 20 },
];

const posts = [
  { 
    id: "1", 
    title: "Introduction à GraphQL", 
    content: "GraphQL est un langage de requête pour les API...",
    summary: "Découvrez les concepts de base de GraphQL et ses avantages.",
    published: true, 
    createdAt: "2025-03-15",
    updatedAt: "2025-03-16",
  },
  { 
    id: "2", 
    title: "Les avantages de GraphQL par rapport à REST", 
    content: "GraphQL offre plusieurs avantages par rapport aux API REST...",
    summary: "Analyse comparative des architectures GraphQL et REST.",
    published: true, 
    createdAt: "2025-03-17",
    updatedAt: null,
  },
  { 
    id: "3", 
    title: "Comment structurer un schéma GraphQL efficace", 
    content: "La conception d'un bon schéma GraphQL est essentielle...",
    summary: "Meilleures pratiques pour concevoir votre schéma GraphQL.",
    published: true, 
    createdAt: "2025-03-18",
    updatedAt: "2025-03-18",
  }
];

const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL!",
    users: () => users,
    posts: () => posts.filter(post => post.published),
    postID: (_, { id }) => posts.find(post => post.id === id),
    postSummary: (_,  { id }) => posts.find(post => post.id === id).summary,
    postContent: (_, { id }) => posts.find(post => post.id === id).content,
  },
 Mutation: {
  createPost: (_, { title, content, summary, published, createdAt, updatedAt }) => {
    console.log("Création d'un post avec les arguments :", { title, content, summary, published, createdAt, updatedAt });
    const newPost = {
      id: posts.length + 1,
      title,
      content,
      summary,
      published,
      createdAt,
      updatedAt,
    };
    posts.push(newPost);
    return newPost;
  },
  updatePost: (_, { id, title, content, summary, published, createdAt, updatedAt }) => {
    const index = posts.findIndex(post => post.id === id);
    if (index !== -1) {
      const updatedPost = { id, title, content, summary, published, createdAt, updatedAt };
      posts[index] = updatedPost;
      return updatedPost;
    }
    return null;
  },
  deletePost: (_, { id }) => {
    const index = posts.findIndex(post => post.id === id);
    if (index !== -1) {
      const deletedPost = posts[index];
      posts.splice(index, 1);
      return deletedPost;
    } 
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

    app.listen(4000, () => {
      console.log(` Serveur GraphQL prêt sur http://localhost:4000${server.graphqlPath}`);
    });
  } catch (error) {
    console.error(" Erreur au démarrage du serveur GraphQL:", error);
  }
};

startServer();
