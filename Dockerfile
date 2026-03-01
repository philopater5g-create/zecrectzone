FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Note: We don't copy data/ or uploads/ because those will be mounted as a persistent volume
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
