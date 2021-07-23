#FROM node:14
FROM arm32v8/node

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Set process variables
#ENV RUN_TIME=123     

# start service
CMD [ "npm", "start" ]
