# Estágio de build do frontend Angular
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio final com Node.js para o backend
FROM node:20-alpine
WORKDIR /app

# Copiar arquivos do backend
COPY backend-server.js ./
COPY package*.json ./
COPY database/ ./database/

# Copiar os arquivos de build do frontend
COPY --from=frontend-build /app/dist/inscrição-catequese/browser ./dist

# Instalar apenas as dependências de produção
RUN npm ci --only=production

# Criar diretório para uploads
RUN mkdir -p uploads && chmod 777 uploads

# Expor porta do backend
EXPOSE 3000

# Variáveis de ambiente para configuração do banco
ENV DATABASE_URL=postgresql://neondb_owner:npg_OdXFbUf5wN2x@ep-shy-hall-acxylv7b-pooler.sa-east-1.aws.neon.tech/neondb
ENV NODE_ENV=production
ENV PORT=3000

# Iniciar o servidor
CMD ["node", "backend-server.js"]