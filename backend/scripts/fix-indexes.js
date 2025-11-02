import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const fixIndexes = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not set');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get current indexes
    const indexes = await usersCollection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(idx => {
      console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop duplicate/googleId indexes if they exist
    const indexNames = indexes.map(idx => idx.name);
    
    if (indexNames.includes('googleId_1')) {
      console.log('\n🗑️  Dropping googleId_1 index (no longer needed)...');
      try {
        await usersCollection.dropIndex('googleId_1');
        console.log('✅ Dropped googleId_1 index');
      } catch (e) {
        console.log('⚠️  googleId_1 index may not exist:', e.message);
      }
    }

    // Check for duplicate email indexes
    const emailIndexes = indexes.filter(idx => 
      JSON.stringify(idx.key).includes('"email":1') && idx.name !== '_id_'
    );
    if (emailIndexes.length > 1) {
      console.log('\n⚠️  Found multiple email indexes, keeping only email_1');
      // email_1 is created by unique: true, so we keep it
      for (const idx of emailIndexes) {
        if (idx.name !== 'email_1' && idx.name !== 'email_1_1') {
          try {
            await usersCollection.dropIndex(idx.name);
            console.log(`✅ Dropped duplicate ${idx.name} index`);
          } catch (e) {
            console.log(`⚠️  Could not drop ${idx.name}:`, e.message);
          }
        }
      }
    }

    if (indexNames.includes('email_1_1')) {
      console.log('\n🗑️  Dropping duplicate email_1_1 index...');
      try {
        await usersCollection.dropIndex('email_1_1');
        console.log('✅ Dropped duplicate email_1_1 index');
      } catch (e) {
        console.log('⚠️  Could not drop email_1_1 (might not exist)');
      }
    }

    if (indexNames.includes('role_1_1')) {
      console.log('\n🗑️  Dropping duplicate role_1_1 index...');
      try {
        await usersCollection.dropIndex('role_1_1');
        console.log('✅ Dropped duplicate role_1_1 index');
      } catch (e) {
        console.log('⚠️  Could not drop role_1_1 (might not exist)');
      }
    }

    console.log('\n✅ Index cleanup completed!');
    console.log('\n📋 Updated indexes:');
    const newIndexes = await usersCollection.indexes();
    newIndexes.forEach(idx => {
      console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixIndexes();

