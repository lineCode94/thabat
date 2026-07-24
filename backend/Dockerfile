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
