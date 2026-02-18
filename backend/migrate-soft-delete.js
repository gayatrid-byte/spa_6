const { pool } = require('./config/database');

async function migrate() {
    try {
        console.log('Starting migration for soft deletes...');

        // Services
        await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE");
        console.log('Added is_deleted to services');

        // Rooms
        await pool.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE");
        console.log('Added is_deleted to rooms');

        // Categories
        await pool.query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE");
        console.log('Added is_deleted to categories');

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
