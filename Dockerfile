FROM node:25-slim
WORKDIR /app
COPY index.js .
COPY package.json .
RUN npm install

EXPOSE 5000/udp
EXPOSE 8080/tcp

CMD [ "node", "index.js" ]