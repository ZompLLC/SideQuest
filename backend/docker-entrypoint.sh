#!/bin/sh
set -e

echo "Waiting for postgres at $DATABASE_HOST:$DATABASE_PORT..."
until pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" > /dev/null 2>&1; do
  sleep 1
done
echo "Postgres is up."

echo "Running migrations..."
export DATABASE_URL="postgresql://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME"
npx node-pg-migrate up

echo "Starting backend dev server..."
exec npm run dev