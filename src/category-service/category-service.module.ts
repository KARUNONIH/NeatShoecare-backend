import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryServiceService } from './category-service.service';
import { CategoryServiceController } from './category-service.controller';
import {
  CategoryService,
  CategoryServiceSchema,
} from './category-service.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryService.name, schema: CategoryServiceSchema },
    ]),
    AuthModule,
  ],
  controllers: [CategoryServiceController],
  providers: [CategoryServiceService],
  exports: [CategoryServiceService],
})
export class CategoryServiceModule {}
