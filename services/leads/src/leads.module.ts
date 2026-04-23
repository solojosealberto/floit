import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminApiGuard } from "./admin-api.guard";
import { AdminLeadsController } from "./admin-leads.controller";
import { InternalApiGuard } from "./internal-api.guard";
import { InternalLeadsController } from "./internal-leads.controller";
import { LeadEntity } from "./lead.entity";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";
import { NotificationDeliveryEntity } from "./notification-delivery.entity";
import { NotificationDispatcherService } from "./notification-dispatcher.service";

@Module({
  imports: [TypeOrmModule.forFeature([LeadEntity, NotificationDeliveryEntity])],
  controllers: [LeadsController, AdminLeadsController, InternalLeadsController],
  providers: [
    LeadsService,
    AdminApiGuard,
    InternalApiGuard,
    NotificationDispatcherService,
  ],
})
export class LeadsModule {}
