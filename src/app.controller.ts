import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    async getHello(): Promise<string> {
        return `<html>
<body>
<h1>Ticket for Events</h1>

<h2>Customer section</h2>
<ul>
	<li>
		<code>GET http://localhost:3000/api/v1/events</code>
	</li>
	<li>
		<code>GET http://localhost:3000/api/v1/events/{id}</code>
	</li>
</ul>

<h2>Administration</h2>
<ul>
	<li>
		<code>POST http://localhost:3000/api/v1/admin/events</code>
	</li>
</ul>
</body>
</html>`;

        return this.appService.getHello();
    }
}
