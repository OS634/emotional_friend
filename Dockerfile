FROM node:alpine AS development

WORKDIR /app

COPY package*.json ./

RUN npm install

ENV OPENAI_API_KEY=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

COPY . .

EXPOSE 3000

CMD ["npm", "start"]