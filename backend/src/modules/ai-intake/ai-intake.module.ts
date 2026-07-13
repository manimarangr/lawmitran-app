import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AiIntakeController } from './ai-intake.controller';
import { AiIntakeService } from './ai-intake.service';

@Module({
  imports: [JwtModule.register({})], // secret passed per-verify (optional auth)
  controllers: [AiIntakeController],
  providers: [AiIntakeService],
})
export class AiIntakeModule {}
