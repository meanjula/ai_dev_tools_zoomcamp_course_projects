FROM node:25-alpine

WORKDIR /app

# copy package manifest and install deps
COPY package*.json ./
RUN npm install

# copy app sources
COPY . .

ENV PORT=3000
EXPOSE 3000

# Run wait-for-db, migrations (best-effort) then start the app
CMD ["sh","-c","node wait-for-db.js && npm run migrate || true && node src/app.js"]
