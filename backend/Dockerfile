# Dockerfile para Backend Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório de dados se não existir
RUN mkdir -p data/nodes data/properties data/workflows data/config

# Expor porta
EXPOSE 5200

# Comando para iniciar a aplicação
CMD ["npm", "start"]
