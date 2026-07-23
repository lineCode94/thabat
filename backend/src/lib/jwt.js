import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export const generateToken = (payload, expiresIn = env.JWT_EXPIRES) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
};
