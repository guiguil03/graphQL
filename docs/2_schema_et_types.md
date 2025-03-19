# Schéma et types GraphQL

Le schéma est le cœur de toute API GraphQL. Il définit la structure des données et les opérations disponibles.

## Structure d'un schéma

Un schéma GraphQL se compose principalement de :

1. **Types d'objets** : Définissent les entités de votre application
2. **Types racines** : Query, Mutation, Subscription
3. **Scalaires** : Types primitifs (String, Int, Boolean, etc.)
4. **Types d'entrée** : Utilisés comme arguments dans les mutations
5. **Types d'énumération** : Ensembles de valeurs prédéfinies
6. **Interfaces et unions** : Pour le polymorphisme

## Types d'objets

Les types d'objets représentent les entités de votre application :

```graphql
type User {
  id: ID!
  name: String!
  age: Int
  email: String!
  posts: [Post!]!
  createdAt: String!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
}
```

### Signification des symboles

- `!` : Indique un champ non nullable (obligatoire)
- `[Type]` : Liste de Type
- `[Type!]` : Liste de Type non nullable (la liste peut être vide, mais ne peut pas contenir de valeurs null)
- `[Type!]!` : Liste non nullable de Type non nullable (la liste doit exister et ne peut pas contenir de valeurs null)

## Types scalaires

GraphQL inclut ces types scalaires par défaut :

- `String` : Chaîne de caractères UTF-8
- `Int` : Entier signé 32 bits
- `Float` : Nombre à virgule flottante
- `Boolean` : true ou false
- `ID` : Identifiant unique (sérialisé comme une String)

Vous pouvez aussi définir vos propres scalaires personnalisés.

## Types racines

Les types racines définissent les points d'entrée de votre API :

```graphql
type Query {
  user(id: ID!): User
  users: [User!]!
  post(id: ID!): Post
  posts(published: Boolean): [Post!]!
}

type Mutation {
  createUser(name: String!, email: String!, age: Int): User!
  createPost(title: String!, content: String!, authorId: ID!): Post!
  updatePost(id: ID!, published: Boolean): Post
  deletePost(id: ID!): Post
}

type Subscription {
  newPost: Post
  newComment(postId: ID!): Comment
}
```

## Types d'entrée

Pour les opérations complexes, vous pouvez utiliser des types d'entrée :

```graphql
input CreateUserInput {
  name: String!
  email: String!
  age: Int
}

input UpdatePostInput {
  title: String
  content: String
  published: Boolean
}

type Mutation {
  createUser(data: CreateUserInput!): User!
  updatePost(id: ID!, data: UpdatePostInput!): Post
}
```

## Types d'énumération

Les énumérations définissent un ensemble fixe de valeurs :

```graphql
enum Role {
  USER
  EDITOR
  ADMIN
}

enum SortDirection {
  ASC
  DESC
}

type User {
  id: ID!
  name: String!
  role: Role!
}

type Query {
  users(sortBy: SortDirection): [User!]!
}
```

## Interfaces

Les interfaces permettent de définir un ensemble de champs que plusieurs types doivent implémenter :

```graphql
interface Node {
  id: ID!
  createdAt: String!
}

type User implements Node {
  id: ID!
  createdAt: String!
  name: String!
  email: String!
}

type Post implements Node {
  id: ID!
  createdAt: String!
  title: String!
  content: String!
}

type Query {
  node(id: ID!): Node
  nodes: [Node!]!
}
```

## Unions

Les unions représentent un type qui peut être l'un des plusieurs types possibles :

```graphql
union SearchResult = User | Post | Comment

type Query {
  search(term: String!): [SearchResult!]!
}
```

## Directives

Les directives permettent de modifier le comportement d'un schéma :

```graphql
directive @deprecated(reason: String) on FIELD_DEFINITION | ENUM_VALUE

type User {
  id: ID!
  name: String!
  email: String!
  oldEmail: String @deprecated(reason: "Utilisez 'email' à la place")
}
```

## Exemple complet de schéma

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
  published: Boolean!
  author: User!
}

input CreateUserInput {
  name: String!
  email: String!
}

input CreatePostInput {
  title: String!
  content: String!
  published: Boolean
}

type Query {
  user(id: ID!): User
  users: [User!]!
  post(id: ID!): Post
  posts(published: Boolean): [Post!]!
}

type Mutation {
  createUser(data: CreateUserInput!): User!
  deleteUser(id: ID!): User
  createPost(authorId: ID!, data: CreatePostInput!): Post!
  updatePost(id: ID!, published: Boolean): Post
  deletePost(id: ID!): Post
}

type Subscription {
  newPost: Post
}
```

## Bonnes pratiques pour les schémas

1. **Nommage cohérent** : Utilisez des conventions de nommage cohérentes (PascalCase pour les types, camelCase pour les champs)
2. **Description** : Documentez chaque type et champ avec des descriptions
3. **Nullabilité** : Réfléchissez attentivement à ce qui doit être nullable ou non
4. **Pagination** : Pour les listes longues, implémentez des solutions de pagination
5. **Composition** : Divisez les schémas complexes en modules plus petits
