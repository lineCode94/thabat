import bcrypt from 'bcrypt';

const password = 'Islamic--1234';
const newHash = await bcrypt.hash(password, 10);
console.log('New hash:', newHash);

const isMatch = await bcrypt.compare(password, newHash);
console.log('Self-test match:', isMatch);