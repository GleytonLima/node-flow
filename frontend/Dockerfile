# Multi-stage build para Frontend Angular
# Stage 1: Build da aplicação
FROM node:18-alpine AS build

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação para produção
RUN npm run build

# Stage 2: Servir com nginx
FROM nginx:alpine

# Copiar arquivos buildados do stage anterior
COPY --from=build /app/dist/node-flow-frontend/browser /usr/share/nginx/html

# Copiar configuração customizada do nginx (opcional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta 80 (padrão do nginx)
EXPOSE 80

# Comando padrão do nginx já está configurado
