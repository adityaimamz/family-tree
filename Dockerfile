FROM node:22-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .

ARG VITE_NEON_AUTH_URL
ENV VITE_NEON_AUTH_URL=$VITE_NEON_AUTH_URL

RUN node -e "console.log('VITE_NEON_AUTH_URL configured at build:', Boolean(process.env.VITE_NEON_AUTH_URL))"

RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]