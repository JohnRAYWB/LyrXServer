import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {CustomValidationPipe} from "./pipe/validation.pipe";


const start = async () => {
  try{
    const app = await NestFactory.create(AppModule)

    const PORT = process.env.PORT || 4221

    app.enableCors()
    app.useGlobalPipes(new CustomValidationPipe())

    await app.listen(PORT, () => {
      console.log(`Server has been started\nPORT = ${PORT}`)
    })
  } catch (e) {
    console.log(e.message)
  }

}

start()