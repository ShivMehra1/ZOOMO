import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Injectable, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";

/**
 * Cross-portal real-time layer. Every app (customer/driver/merchant/admin)
 * connects once and joins whichever rooms it cares about:
 *   order:<orderId>       - one order's full lifecycle (status, driver
 *                            location, chat) - customer + assigned driver
 *   restaurant:<id>        - new orders / status changes for one kitchen
 *   driver:<driverId>      - this driver's own assignment/status changes
 *   admin                  - platform-wide firehose (new orders, payout
 *                            requests, driver assignments) for the HQ view
 *
 * Room membership isn't itself an authorization boundary (the same JWT that
 * already gates every REST call is what protects the underlying data) — this
 * channel only pushes live UI updates for data the client can already fetch.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: "*" } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger("RealtimeGateway");

  handleConnection(client: Socket) {
    this.logger.debug(`connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`disconnected: ${client.id}`);
  }

  @SubscribeMessage("join")
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    if (!data?.room) return;
    client.join(data.room);
  }

  @SubscribeMessage("leave")
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    if (!data?.room) return;
    client.leave(data.room);
  }

  /** Server-side emit helper — used by other modules' services. */
  emitToRoom(room: string, event: string, payload: unknown) {
    this.server?.to(room).emit(event, payload);
  }

  emitToRooms(rooms: string[], event: string, payload: unknown) {
    for (const room of rooms) this.emitToRoom(room, event, payload);
  }
}
