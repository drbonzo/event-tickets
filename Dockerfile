FROM node:11.15.0-alpine

WORKDIR /app
COPY package.json yarn.lock tsconfig.json tsconfig.build.json ./
COPY src /app/src
RUN yarn install
# FIXME dirty hack for Docker problems with native module
RUN yarn add sqlite3 --force
RUN yarn build

EXPOSE 80

CMD ["yarn", "start:dev"]
