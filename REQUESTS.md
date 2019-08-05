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

## Reserve Event 5 - available tickets - but failing at sellingOptions

- even: 44, 45, 46
- all_together: 50, 51, 52, 53
- avoid_one: 58, 59

```
http --form POST http://localhost:3000/api/v1/purchases \
  Content-Type:application/x-www-form-urlencoded \
  ticketIds=44 \
  ticketIds=45 \
  ticketIds=46 \
  ticketIds=50 \
  ticketIds=51 \
  ticketIds=52 \
  ticketIds=53 \
  ticketIds=58 \
  ticketIds=59 \
  customerId=2
```

### Reserve Event 5 - even

```
http --form POST http://localhost:3000/api/v1/purchases \
  Content-Type:application/x-www-form-urlencoded \
  ticketIds=44 \
  ticketIds=45 \
  ticketIds=46 \
  customerId=2
```

### Reserve Event 5 - all_together

```
http --form POST http://localhost:3000/api/v1/purchases \
  Content-Type:application/x-www-form-urlencoded \
  ticketIds=50 \
  ticketIds=51 \
  ticketIds=52 \
  ticketIds=53 \
  customerId=2
```

All tickets = 
48
49
50
51
52
53
54
55
56
57

### Reserve Event 5 - avoid_one

```
http --form POST http://localhost:3000/api/v1/purchases \
  Content-Type:application/x-www-form-urlencoded \
  ticketIds=58 \
  ticketIds=59 \
  customerId=2
```

58, 59, 60


### Reserve without errors

```
http --form POST http://localhost:3000/api/v1/purchases \
  Content-Type:application/x-www-form-urlencoded \
  ticketIds=45 \
  ticketIds=46 \
  ticketIds=48 \
  ticketIds=49 \
  ticketIds=50 \
  ticketIds=51 \
  ticketIds=52 \
  ticketIds=53 \
  ticketIds=54 \
  ticketIds=55 \
  ticketIds=56 \
  ticketIds=57 \
  ticketIds=58 \
  ticketIds=59 \
  ticketIds=60 \
  customerId=2
```


# View reservation/purchase

```
http GET http://localhost:3000/api/v1/purchases/2
```

