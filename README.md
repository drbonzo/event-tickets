# Event Tickets

## Nest JS

[This uses NestJS](./README-nestjs.md)

## TypeORM

Config: `/ormconfig.json`

Create new migration
```
yarn ts-node ./node_modules/.bin/typeorm migration:generate -n CreateAllEntities
```

Run migrations
```
yarn typeorm migration:run
```


## Installation

### Local development

Install node (version from `.nvmrc`), for example: 

```
nvm install v11.15.0
```


```
yarn install
yarn typeorm migration:run
```

## Running

```
yarn start:dev
```

Load fixtures (uses [HTTPie](https://httpie.org/))

```
http POST http://localhost:3000/api/v1/admin/fixtures
```

More requests in [REQUESTS.md](./REQUESTS.md)

## Tests

```
yarn test
yarn test:watch
```

