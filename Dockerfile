FROM node:11.15.0-alpine

WORKDIR /app
COPY package.json yarn.lock tsconfig.json tsconfig.build.json ./
RUN yarn install
COPY . ./
RUN yarn build

EXPOSE 80

CMD ["yarn", "start:dev"]
