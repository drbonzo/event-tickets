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
