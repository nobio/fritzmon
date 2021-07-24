# FROM node:14
FROM arm32v7/node

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

# Bundle app source
COPY . .

CMD [ "npm", "start" ]
