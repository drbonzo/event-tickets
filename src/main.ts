import "reflect-metadata"; // needed by TypeORM
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(PORT, HOSTNAME);
}
bootstrap();
