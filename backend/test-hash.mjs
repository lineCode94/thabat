import bcrypt from 'bcrypt';
bcrypt.compare('Islamic--1234', '$2b$10$HVB2Wo.L3y4Nu1kbQ958ROL7GWUUzLkkvwelOhVYjFusjHNVSNQ5').then(r => console.log('Match:', r));