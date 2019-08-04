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
