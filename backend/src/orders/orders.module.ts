import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OrdersController, AdminOrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrderEmailService } from "./order-email.service";

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrderEmailService],
  exports: [OrdersService],
})
export class OrdersModule {}
