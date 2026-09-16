import { Global, Module } from "@nestjs/common";
import { RealtimeGateway } from "./realtime.gateway";

// Global so any feature module can inject RealtimeGateway without importing
// this module explicitly.
@Global()
@Module({
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
