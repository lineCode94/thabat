FROM node:20-alpine

WORKDIR /app

# Copy root + backend package files (needed for npm workspaces)
COPY package*.json ./
COPY backend/package.json ./backend/package.json

# Install backend dependencies
RUN npm ci --omit=dev --workspace=backend

# Copy Prisma schema and generate client
COPY backend/prisma ./backend/prisma
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Copy backend source
COPY backend ./backend

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=backend/prisma/schema.prisma && npx prisma db seed --schema=backend/prisma/schema.prisma && npm start --workspace=backend"]
