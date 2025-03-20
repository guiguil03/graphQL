const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Nettoyer la base de données
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Base de données nettoyée');

  // Créer des utilisateurs
  const user1 = await prisma.user.create({
    data: {
      name: 'Guigui',
      email: 'guigui@example.com',
      password: 'password123'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Test',
      email: 'test@example.com',
      password: 'password456'
    }
  });

  console.log('Utilisateurs créés:', user1, user2);

  // Créer des posts
  const post1 = await prisma.post.create({
    data: {
      title: 'Introduction à GraphQL',
      content: 'GraphQL est un langage de requête pour les API...',
      summary: 'Découvrez les concepts de base de GraphQL et ses avantages.',
      published: true,
      authorId: user1.id
    }
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Les avantages de GraphQL par rapport à REST',
      content: 'GraphQL offre plusieurs avantages par rapport aux API REST...',
      summary: 'Analyse comparative des architectures GraphQL et REST.',
      published: true,
      authorId: user1.id
    }
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'Comment structurer un schéma GraphQL efficace',
      content: 'La conception d\'un bon schéma GraphQL est essentielle...',
      summary: 'Meilleures pratiques pour concevoir votre schéma GraphQL.',
      published: false,
      authorId: user2.id
    }
  });

  console.log('Posts créés:', post1, post2, post3);

  console.log('Données de départ ajoutées avec succès !');
}

main()
  .catch((e) => {
    console.error('Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
