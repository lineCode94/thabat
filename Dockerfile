FROM node:20-alpine

WORKDIR /app

# Copy root + backend package files (needed for npm workspaces)
COPY package*.json ./
COPY backend/package.json ./backend/package.json

RUN npm ci --omit=dev --workspace=backend

# Copy prisma schema and generate client
COPY backend/prisma ./backend/prisma
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Copy the rest of the backend source
COPY backend ./backend

EXPOSE 5000

CMD npx prisma migrate deploy --schema=backend/prisma/schema.prisma && npm start --workspace=backend