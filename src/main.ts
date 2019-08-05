import "reflect-metadata"; // needed by TypeORM
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(PORT, HOSTNAME);

    // tslint:disable-next-line:no-console
    console.log(`Listening on ${HOSTNAME}:${PORT}`);
}

bootstrap().catch(e => {
    // tslint:disable-next-line:no-console
    console.error(e);
    process.exit(1);
});
