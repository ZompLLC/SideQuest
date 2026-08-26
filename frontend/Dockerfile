FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8081 19000 19001 19002

# --lan: only reachable on your local WiFi, safer/faster option
# --tunnel: anyone can reach you with the URL, slower/reliable option
CMD ["npx", "expo", "start", "--lan"]