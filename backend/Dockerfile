FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# Copy the rest of the source code
COPY . .

# Render/most PaaS platforms inject PORT; server.js should read process.env.PORT
EXPOSE 5000

# Run migrations then start the server
CMD npx prisma migrate deploy --schema=prisma/schema.prisma && npm start
FROM node:20-alpine

WORKDIR /app

# Copy root package files + workspace package.json files
COPY package*.json ./
COPY backend/package.json ./backend/
COPY prisma ./prisma
COPY backend/prisma ./backend/prisma

# Install only backend workspace dependencies
RUN npm ci --omit=dev --workspace=backend

# Generate Prisma client
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Copy the rest of the backend source code
COPY backend ./backend

EXPOSE 5000

CMD npx prisma migrate deploy --schema=backend/prisma/schema.prisma && npm start --workspace=backend