import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TransactionCategory,
  TransactionCategorySchema,
} from './transaction-category.schema';
import { TransactionCategoryService } from './transaction-category.service';
import { TransactionCategoryController } from './transaction-category.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionCategory.name, schema: TransactionCategorySchema },
    ]),
  ],
  controllers: [TransactionCategoryController],
  providers: [TransactionCategoryService],
  exports: [TransactionCategoryService],
})
export class TransactionCategoryModule {}
