FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# O ideal é copiar apenas package.json e iniciar
COPY package*.json ./

# Evita o erro caso a pasta frontend ainda seja vazia e não tenha package.json
RUN if [ -f package.json ]; then npm install; fi

# O código fonte ficará em volume para hot reload rodando localmente no compose.
COPY . .

EXPOSE 3000

# Executar em modo desenvolvimento (usando sh condicional para não quebrar se não houver projeto ainda)
CMD ["sh", "-c", "if [ -f package.json ]; then npm run dev; else echo 'Projeto Next.js não inicializado. Execute create-next-app na pasta frontend.'; sleep infinity; fi"]
