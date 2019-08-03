# Create Event with Ticket Types and Tickets

This is a simple administration functionality that allows to create Event, and tickets with simple algorithm

## Problems

- Allow to create Event, TicketTypes, and Tickets

## Solutions

- Provide simple endpoint to create an Event with TicketTypes at once
    - `POST /events`
    - body JSON

```json
{
    "event": {
        "name": "New Event",
        "startDateTime": "2019-09-01T18:00:00Z",
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
}
```

This example request will create

- new `Event`
- three `TicketTypes` for that `Event`
- count of 4, 10 and 5 `Tickets` for appropriate `TicketType`

# Expire a reservation manualy

## Problems

- Allow to manualy expire a reservation

## Solutions

- `DELETE /reservations/123/`
- allows to delete reservation if 15 minutes have passed since it creation

# List of User's reservations

# List of User's purchases

