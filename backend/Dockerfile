FROM node:20-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Using entrypoint.sh to help with migrations since the script runs at container start up compared to running at build time
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Decorative only — doesn't actually publish the port (that's ports: in docker-compose.yml). Real port is set by BACKEND_PORT in backend/.env.
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]