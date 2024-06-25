FROM node:18

WORKDIR /app

RUN npm install -g react-native-cli

COPY . .

RUN npm install

EXPOSE 8081

CMD ["npm", "start"]
