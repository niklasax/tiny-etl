import pool from './database';

export async function initDatabase() {
  try {
    // Create uploads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        file_id VARCHAR(255) UNIQUE NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        row_count INTEGER,
        column_count INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cleaning_jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cleaning_jobs (
        id SERIAL PRIMARY KEY,
        file_id VARCHAR(255) REFERENCES uploads(file_id),
        rules JSONB NOT NULL,
        original_row_count INTEGER,
        cleaned_row_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}
