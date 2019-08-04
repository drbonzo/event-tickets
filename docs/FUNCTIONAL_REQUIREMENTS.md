# Functional Requirements

## Assumptions

- (SIMPLIFICATION) TicketType does NOT assign ticket to specific seat in the stadium/concert hall, etc
- **(NEEDS CLARIFICATION)** Assuming that "Each ticket has a selling option defined" should refer to `TicketType`, not `Ticket` itself. Otherwise some tickets would be marked `even` and other not, so we could not determine (without additional rules) whether we can buy 2 `even` tickets and single `avoid_one` leaving 2 available.
    - > Each ticket has a selling option defined:
        - > `even` we can only buy tickets in quantity that is even 
            - becomes: you can reserve, and buy even quantity of tickets of the same `TicketType` for the same `Event`
        - > `all_together` we can only buy all the tickets at once
            - becomes: you can only buy all tickets of the same `TicketType` for the same `Event` 
        - > `avoid_one` we can only buy tickets in a quantity that will not leave only 1 ticket
            - (...) that will not leave only 1 `available` ticket  of same `TicketType` for the same `Event`
- Assuming that there is only one selling option assigned for `TicketType`

# [DONE] Get info about an event

## Problems:

1. User wants to view existing Events
2. Event has
    - name
    - start date and time
    - has multiple types of ticket
        - assuming ticket type has specified price, and all tickets of the same type have the same prices

## Solutions

1. Provide list of Events
    - mark events as past/active (using Event start date and current date)
4 Event and TicketType
    - `Event`
        - id
        - name
        - start date and time
        - `TicketType` (relation 1:N)
    - `TicketType`
        - id
        - name (may describe location on the stadium, concert hall, etc)
        - price
        - `Event` (relation N:1)
    - `Ticket`
        - id
        - `TicketType` (relation N:1)
        - `price`

# [DONE] Get info about available tickets for event

## Problems

1. User wants to see details of selected Event to buy tickets
2. User wants to see what type of tickets are available, at what prices
3. User wants to see quantities of tickets available for each type of ticket

## Solutions

1. Provide details of single Event
    - list Event properties
2. Provide list of `TicketTypes` for selected `Event` 
    - for each `TicketType` list:
        - `price`
        - `sellingOption`
3. Provide quantities of available tickets for each `TicketType`    

To achieve this:

- Mark tickets (`Ticket.status`) so we know whether ticket is available, reserved, or sold:
    - mark as `available`
    - mark as `reserved`
    - mark as `sold`
- Ticket is available for sale when `status` = `available`
- `Ticket`
    - `id`
    - `status`
    - `TicketType` (relation)

# [TODO] Reserve tickets

_We can split Reservations from Purchases and Payments - if there is a need to (like tracking objects, statistics, etc)._

_Currently we can handle all cases with simpler solution._

## Problems

1. User wants to see what Tickets are available, of each type and in which quantity
2. User wants to pick specific `Tickets` to be reserved and later bought
3. User needs confirmation whether reservation has succeed or not

### Needs some simplification

- Assuming how reservation will work:
    - single reservation is for single Event only
    - single reservation may span multiple TicketTypes of the same Event
    - reservation is accepted as a whole, or discarded as a whole (when selected tickets cannot be reserved)
    - cannot reserve tickets for expired Event

## Solutions

1. Provide list of available (simplification, as User can only buy available Tickets) `Tickets` for an event
    - group by `TicketType`
2. Do the reservation:
    - perform reservation validation of user selected tickets
        - check if reserving at least one `Ticket`
        - check if tickets are from the same Event, single Event
        - check if Event start date is not in the past
        - check if `TicketType.sellingOptions` are preserved
        - check if `Ticket` is available for sale
    - use SQL transations!
3. In case of:
    - SUCCESS
        - create `Purchase` object with state = `waits_for_payment`, connect it to User (`Customer`)
        - create mark tickets are reserved by this `Purchase`
        - return the `Purchase` object
    - ERROR
        - reservation is NOT created
        - return list of all problems found

_We could make this complex (if there is a reason to) by introducing `TicketReservation` etc, but current solution is enough to cover use cases_

# [TODO] Release tickets from expired Purchases

## Problems

1. Unpaid reservation expires after 15 minutes

## Solutions

1. Provide background-run task that expires expired `Purchases`
    - find `Purchases` with `status = waits_for_payment` and `expiresAfter < currentDate`
    - mark them as expired (`Purchase.status := expired`)
    - mark `Tickets` from that `Purchase` as `available`
        - set `Ticket.reservation_id := NULL`
        - set `Ticket.status = available`
    - use SQL transations!

# [TODO] Pay for ticket

## Problems

1. User wants to pay for his reservation (`Purchase`)
2. When we receive payment confirmation we want to assign bought `Tickets` to the User (`Customer`)

## Solutions

Payment system integration will be simplified

### Usually payment integration works like this:

1. POS (our system) creates new payment in the payment system (via its API) and receives a `token` (a string value).
    - `token` points to payment configuration, amount to pay, currency, etc
2. User is redirected to payment service website with the `token` in the URL
    - so the payment system knows what payment will be processed
3. User completes payment via any of available methods
4. Payment system receives the money
5. Payment system notifies our POS (using the `token`) that the payment has been completed
    - by sending full payment status
    - or by just notifying our system that we should check the status of the payment
        - then our system does another API call to check the payment result

### As we implement only API side of the system, we will simplify the integration:

1. Integrate with Payment system
    - Provide API endpoint to start new Payment in the payment system
        - `POST /purchases/{id}/payments`
        - internally it will connect with Payment Gateway
        - endpoint will return the `token` from payment system
        - `token` will be saved in `Purchase.paymentToken`
        - allow only for unpaid `Purchases`
        - this will allow to start multiple payments for unpaid `Purchases`
    - Provide API endpoint so the payment system can notify that the payment status has changed
        - `POST /payments/{token}/notifications`
        - internally a request to Payment Gateway will be performed to check for payment status
        - in case of
            - Success
                - Find `Purchase` by `paymentToken` = `token`
                - Set `Purchase.status` to `paid`
                - Mark `Tickets` as `sold`
            - Error
                - Let user repeat payment operation

Additionaly we could:

- do not let User pay twice for the same `Purchase`
- we could track all payment operations in the database, if needed

# [DONE] Get info about reservation

## Problems

1. User wants to see reservation status
    - what tickets were reserved
    - has payment been accepted

## Solutions

1. Provide `Purchase` details
    - show `Purchase` details
        - total amout to pay
        - whether it has been paid
        - if paid:
            - show payment details (if paid)
    - show list of reserved tickets
        - `Ticket`
            - ticket number
            - price
        - `TicketType`
            - name
        - `Event`
            - `name`
            - `startDateTime`
    - check if user can see this page (whether `Purchase` belongs to him)
        - this will not be implemented
