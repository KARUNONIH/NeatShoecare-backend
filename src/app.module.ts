import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoryServiceModule } from './category-service/category-service.module';
import { ServiceModule } from './service/service.module';
import { OrderModule } from './order/order.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TransactionCategoryModule } from './transaction-category/transaction-category.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    AuthModule,
  CategoryServiceModule,
    ServiceModule,
    OrderModule,
  TransactionCategoryModule,
  TransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
