const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) return false;

  const hash = Buffer.from(hashHex, 'hex');
  const derived = await scryptAsync(password, salt);
  if (hash.length !== derived.length) return false;
  return crypto.timingSafeEqual(hash, derived);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
