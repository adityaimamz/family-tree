FROM node:22-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .

RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]
