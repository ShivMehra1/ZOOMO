import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /* ================= GET USER ORDERS ================= */
  @Get("mine")
  getMyOrders(@Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }

    return this.ordersService.getUserOrders(req.user.id);
  }

  /* ================= GET ORDER BY ID ================= */
  @Get(":id")
  getOrder(@Param("id") id: string, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }

    return this.ordersService.getOrderById(id, req.user.id);
  }

  /* ================= CREATE ORDER ================= */
  @Post()
  createOrder(@Req() req, @Body() body) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }

    return this.ordersService.createOrder(req.user.id, body);
  }

  /* ================= QUOTE (preview fee/tax/total before placing) ================= */
  @Post("quote")
  getQuote(@Req() req, @Body() body) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }

    return this.ordersService.getQuote(req.user.id, body);
  }

  /* ================= CANCEL ORDER ================= */
  @Patch(":id/cancel")
  cancelOrder(@Param("id") id: string, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  /* ================= RATE ORDER ================= */
  @Patch(":id/rate")
  rateOrder(@Param("id") id: string, @Body() body, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.rateOrder(id, req.user.id, Number(body.rating), body.comment);
  }

  @Patch(":id/rate-driver")
  rateDriver(@Param("id") id: string, @Body() body, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.rateDriver(id, req.user.id, Number(body.rating), body.comment);
  }

  @Patch(":id/extra-tip")
  extraTip(@Param("id") id: string, @Body() body, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.addExtraTip(id, req.user.id, Number(body.amount));
  }

  /* ================= GATE PING ================= */
  @Patch(":id/gate-ping")
  gatePing(@Param("id") id: string, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.gatePing(id, req.user.id);
  }

  /* ================= DROP-OFF PREFERENCE ================= */
  @Patch(":id/drop-off")
  setDropOff(@Param("id") id: string, @Body() body, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.setDropOff(id, req.user.id, body.preference, body.note);
  }

  /* ================= LATE CREDIT ================= */
  @Patch(":id/late-credit")
  grantLateCredit(@Param("id") id: string, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.grantLateCredit(id, req.user.id);
  }

  /* ================= RIDE CHAT ================= */
  @Get(":id/messages")
  getMessages(@Param("id") id: string, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.getMessages(id, req.user.id);
  }

  @Post(":id/messages")
  sendMessage(@Param("id") id: string, @Body() body, @Req() req) {
    if (req.user.role !== "USER") {
      throw new ForbiddenException("Access denied");
    }
    return this.ordersService.sendMessage(id, req.user.id, body.text);
  }
}
