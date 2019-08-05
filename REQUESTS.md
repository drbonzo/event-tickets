# Load fixtures

```
http POST http://localhost:3000/api/v1/admin/fixtures
```

# Create Events

```
echo '{
    "event": {
        "name": "New Event",
        "startDateTime": "2019-09-01T18:00:00Z"
    },
    "ticketTypes": [
        {
            "name": "Type 1",
            "sellingOption": "even",
            "numberOfTickets": 4,
            "price": 30.00
        },
        {
            "name": "Type 2",
            "sellingOption": "all_together",
            "numberOfTickets": 10,
            "price": 12.95
        },
        {
            "name": "Type 3",
            "sellingOption": "avoid_one",
            "numberOfTickets": 5,
            "price": 25.00
        }
    ]
}' | http POST http://localhost:3000/api/v1/admin/events Content-Type:application/json
```

# Get All Events

```
http GET http://localhost:3000/api/v1/events
```

# Get Event details

```
http GET http://localhost:3000/api/v1/events/1
http GET http://localhost:3000/api/v1/events/2
http GET http://localhost:3000/api/v1/events/3
http GET http://localhost:3000/api/v1/events/4
http GET http://localhost:3000/api/v1/events/5
```

# Reserve tickets

## Reserve available tickets

```
http --form POST http://localhost:3000/api/v1/purchases \
  Content-Type:application/x-www-form-urlencoded \
  ticketIds=43 \
  ticketIds=48 \
  ticketIds=58 \
  customerId=2
```

## Try to reserve sold or reserved tickets

```
http --form POST http://localhost:3000/api/v1/purchases \
  Content-Type:application/x-www-form-urlencoded \
  ticketIds=31 \
  ticketIds=32 \
  customerId=2
```

## Try to reserve Tickets from past Event

```
http --form POST http://localhost:3000/api/v1/purchases \
  Content-Type:application/x-www-form-urlencoded \
  ticketIds=1 \
  customerId=2
```

# View reservation/purchase

```
http GET http://localhost:3000/api/v1/purchases/2
```

