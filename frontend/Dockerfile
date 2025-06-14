# --- Стадия 1: Сборка зависимостей ---
FROM node:lts-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# --- Стадия 2: Сборка проекта ---
FROM node:lts-alpine AS build
WORKDIR /app
# Копируем зависимости из предыдущего слоя
COPY --from=deps /app/node_modules ./node_modules
# Копируем остальной код проекта
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

# --- Стадия 3: Финальный образ ---
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Копируем только то, что нужно для запуска
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]