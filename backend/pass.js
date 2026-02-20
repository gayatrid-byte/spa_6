const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('Generating new password hashes...\n');
  
  // Generate new hashes with bcryptjs
  const ownerHash = await bcrypt.hash('owner@123', 10);
  const centerHash = await bcrypt.hash('center@123', 10);
  const staffHash = await bcrypt.hash('staff@123', 10);
  
  console.log('Copy these SQL commands and run them in MySQL:');
  console.log('===============================================\n');
  
  console.log(`UPDATE users SET password = '${ownerHash}' WHERE email = 'owner@gmail.com';`);
  console.log(`UPDATE users SET password = '${centerHash}' WHERE email = 'center@gmail.com';`);
  console.log(`UPDATE users SET password = '${staffHash}' WHERE email = 'staff@gmail.com';`);
  
  console.log('\nOr run all at once:');
  console.log(`UPDATE users SET password = '${ownerHash}' WHERE email = 'owner@gmail.com';`);
  console.log(`UPDATE users SET password = '${centerHash}' WHERE email = 'center@gmail.com';`);
  console.log(`UPDATE users SET password = '${staffHash}' WHERE email = 'staff@gmail.com';`);
}

generateHashes().catch(console.error);