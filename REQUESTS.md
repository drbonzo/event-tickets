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
```

## Event with multiple TickeTypes and Tickets

```
{
    "event": {
        "id": 1,
        "name": "New Event 1",
        "startDateTime": 1567360800000
    },
    "ticketTypes": [
        {
            "availableTicketCount": 3,
            "eventId": 1,
            "id": 1,
            "name": "Type 1",
            "price": 30,
            "reservedTicketCount": 0,
            "sellingOption": "even",
            "soldTicketCount": 1
        },
        {
            "availableTicketCount": 10,
            "eventId": 1,
            "id": 2,
            "name": "Type 2",
            "price": 12.95,
            "reservedTicketCount": 0,
            "sellingOption": "all_together",
            "soldTicketCount": 0
        },
        {
            "availableTicketCount": 5,
            "eventId": 1,
            "id": 3,
            "name": "Type 3",
            "price": 25,
            "reservedTicketCount": 0,
            "sellingOption": "avoid_one",
            "soldTicketCount": 0
        }
    ]
}
```

## Event with TicketType but no Tickets

```
{
    "event": {
        "id": 6,
        "name": "Event with no Tickets",
        "startDateTime": 1567447200000
    },
    "ticketTypes": [
        {
            "availableTicketCount": 0,
            "eventId": 6,
            "id": 14,
            "name": "Type 1",
            "price": 30,
            "reservedTicketCount": 0,
            "sellingOption": "even",
            "soldTicketCount": 0
        }
    ]
}
```

## Event with no TicketTypes

```
{
    "event": {
        "id": 7,
        "name": "Event with no TicketTypes",
        "startDateTime": 1567447200000
    },
    "ticketTypes": []
}
```
