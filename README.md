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

```
yarn install
yarn typeorm migration:run
```

## Running

```
yarn start:dev
```

Load fixtures:

```
http POST http://localhost:3000/api/v1/admin/fixtures
```

## Tests

```
yarn test
yarn test:watch
```

