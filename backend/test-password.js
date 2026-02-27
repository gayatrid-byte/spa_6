const bcrypt = require('bcryptjs');

async function testPassword() {
  const testPassword = 'owner@123';
  const storedHash = '$2b$10$TSXJyTp9dxcw3xW9xmuToeNyBpMi9CQiu9P7syesWLWkup7pM9vEm';
  
  try {
    const match = await bcrypt.compare(testPassword, storedHash);
    console.log('Password match:', match);
    
    // Also test generating a new hash
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('New hash would be:', newHash);
    console.log('Would match:', await bcrypt.compare(testPassword, newHash));
  } catch (error) {
    console.error('Error:', error);
  }
}

testPassword();