/**
 * Script to clean up orphaned avatar files
 * 
 * This script scans the avatar uploads directory and compares the files with
 * the avatar paths stored in the database. Any files that are not referenced
 * in the database will be deleted.
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Path to avatars directory
const AVATARS_DIR = path.join(__dirname, '../public/uploads/avatars');

async function cleanupOrphanedAvatars() {
  console.log('Starting avatar cleanup...');
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(AVATARS_DIR)) {
      fs.mkdirSync(AVATARS_DIR, { recursive: true });
      console.log('Created avatars directory');
      return;
    }
    
    // Get all avatar files
    const files = fs.readdirSync(AVATARS_DIR);
    console.log(`Found ${files.length} files in avatars directory`);
    
    if (files.length === 0) {
      console.log('No files to clean up');
      return;
    }
    
    // Get all avatar paths from database
    const users = await db('users').select('avatar', 'avatar_url');
    
    const dbAvatarPaths = new Set();
    
    // Collect all avatar paths from the database
    users.forEach(user => {
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const filename = path.basename(user.avatar);
        dbAvatarPaths.add(filename);
      }
      
      if (user.avatar_url && user.avatar_url.startsWith('/uploads/avatars/')) {
        const filename = path.basename(user.avatar_url);
        dbAvatarPaths.add(filename);
      }
    });
    
    console.log(`Found ${dbAvatarPaths.size} avatar references in database`);
    
    // Find orphaned files
    let deletedCount = 0;
    
    for (const file of files) {
      // Skip .gitkeep and other hidden files
      if (file.startsWith('.')) continue;
      
      if (!dbAvatarPaths.has(file)) {
        // This file is not referenced in the database
        const filePath = path.join(AVATARS_DIR, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted orphaned avatar: ${file}`);
          deletedCount++;
        } catch (err) {
          console.error(`Error deleting file ${file}:`, err);
        }
      }
    }
    
    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned avatar files`);
  } catch (error) {
    console.error('Error during avatar cleanup:', error);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupOrphanedAvatars()
    .then(() => {
      console.log('Avatar cleanup finished');
      process.exit(0);
    })
    .catch(err => {
      console.error('Avatar cleanup failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = cleanupOrphanedAvatars;
} 