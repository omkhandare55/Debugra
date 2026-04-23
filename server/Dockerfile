FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
