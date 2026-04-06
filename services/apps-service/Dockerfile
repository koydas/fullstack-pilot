FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
ENV PORT=4000
EXPOSE 4000
CMD ["npm", "start"]
