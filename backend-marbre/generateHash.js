const bcrypt = require('bcryptjs');

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

generateHash('admin123'); // mot de passe que tu souhaites pour le client
