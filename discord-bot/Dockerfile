# Discord duty bot container
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY duty-bot.js ./

CMD ["node", "duty-bot.js"]
