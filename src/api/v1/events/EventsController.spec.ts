import { EventsController } from "./EventsController";
import { EventDetails, EventsServiceInterface } from "./EventsService";
import { SELLING_OPTION_EVEN } from "../../../entity/TicketType";
import { EventEntity } from "../../../entity/EventEntity";

describe("Events Controller", () => {
    let controller: EventsController;
    let eventsService: EventsServiceInterface;

    describe("getAllEvents()", () => {
        beforeEach(async () => {
            eventsService = {
                getAllEvents: jest.fn(async () => {
                    return [
                        {
                            id: 1,
                            name: "Event 1",
                            startDateTime: 1234,
                            availableTicketsCount: 5,
                        },
                        {
                            id: 2,
                            name: "Event 2",
                            startDateTime: 5678,
                            availableTicketsCount: 10,
                        },
                    ];
                }),
                getEventDetails: jest.fn(),
            };
            controller = new EventsController(eventsService);
        });

        it("should return array of Events with some details", () => {
            return expect(controller.getAllEvents()).resolves.toMatchSnapshot();
        });
    });

    describe("getEventDetails()", () => {
        beforeEach(async () => {
            eventsService = {
                getAllEvents: jest.fn(),
                getEventDetails: jest.fn(async () => {
                    const eventDetails: EventDetails = {
                        event: {
                            id: 1,
                            name: "Event 1",
                            startDateTime: 1234,
                        },
                        ticketTypes: [
                            {
                                ticketType: {
                                    id: 2,
                                    name: "TicketType 2",
                                    event: new EventEntity(),
                                    tickets: [],
                                    price: 12.95,
                                    sellingOption: SELLING_OPTION_EVEN,
                                },
                                ticketCounts: {
                                    id: 2,
                                    availableTicketCount: 10,
                                    reservedTicketCount: 2,
                                    soldTicketCount: 4,
                                },
                                availableTicketIds: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                            },
                        ],
                    };

                    return eventDetails;
                }),
            };
            controller = new EventsController(eventsService);
        });

        it("should return Event with details", async () => {
            const result = await controller.getEventDetails(1);

            const mockedMethod = eventsService.getEventDetails as jest.Mock<any>;
            expect(mockedMethod.mock.calls[0]).toEqual([1]);

            expect(result).toMatchSnapshot();
        });
    });
});
