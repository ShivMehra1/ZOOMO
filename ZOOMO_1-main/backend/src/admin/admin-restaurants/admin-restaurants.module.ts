import { Module } from "@nestjs/common";
import { AdminRestaurantsController } from "./admin-restaurants.controller";
import { AdminRestaurantsService } from "./admin-restaurants.service";
import { PrismaModule } from "../../common/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AdminRestaurantsController],
  providers: [AdminRestaurantsService],
})
export class AdminRestaurantsModule {}
