import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminCmsController } from "./admin-cms.controller";
import { CmsController } from "./cms.controller";
import { CmsService } from "./cms.service";

@Module({
  imports: [AuthModule],
  controllers: [CmsController, AdminCmsController],
  providers: [CmsService],
})
export class CmsModule {}
