import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { InstagramPostController } from './instagram-post.controller';
import { InstagramPostService } from './instagram-post.service';
import { MetaApiService } from './meta-api.service';
import { ManualInstagramService } from './manual-instagram.service';
import { InstagramPost, InstagramPostSchema } from './instagram-post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InstagramPost.name, schema: InstagramPostSchema },
    ]),
    ConfigModule,
  ],
  controllers: [InstagramPostController],
  providers: [InstagramPostService, MetaApiService, ManualInstagramService],
  exports: [InstagramPostService, MetaApiService, ManualInstagramService],
})
export class InstagramPostModule {}
