require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
};

const initDatabase = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        age INTEGER NOT NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    const existingUsers = await query('SELECT COUNT(*) FROM users');
    
    if (parseInt(existingUsers[0].count) === 0) {
      await query(`
        INSERT INTO users (name, age) VALUES 
        ('Guigui', 25),
        ('Test', 20)
      `);
      
      await query(`
        INSERT INTO posts (title, content, summary, published, created_at) VALUES 
        ('Introduction à GraphQL', 'GraphQL est un langage de requête pour les API...', 'Découvrez les concepts de base de GraphQL et ses avantages.', true, '2025-03-15'),
        ('Les avantages de GraphQL par rapport à REST', 'GraphQL offre plusieurs avantages par rapport aux API REST...', 'Analyse comparative des architectures GraphQL et REST.', true, '2025-03-17'),
        ('Comment structurer un schéma GraphQL efficace', 'La conception d''un bon schéma GraphQL est essentielle...', 'Meilleures pratiques pour concevoir votre schéma GraphQL.', true, '2025-03-18')
      `);
    }

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
  }
};

module.exports = {
  query,
  initDatabase
};
