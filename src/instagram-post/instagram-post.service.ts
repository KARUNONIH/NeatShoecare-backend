import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InstagramPost, InstagramPostDocument } from './instagram-post.schema';
import {
  CreateInstagramPostDto,
  UpdateInstagramPostDto,
} from './dto/instagram-post.dto';
import { MetaApiService } from './meta-api.service';
import { ManualInstagramService } from './manual-instagram.service';

@Injectable()
export class InstagramPostService {
  private readonly logger = new Logger(InstagramPostService.name);

  constructor(
    @InjectModel(InstagramPost.name)
    private instagramPostModel: Model<InstagramPostDocument>,
    private metaApiService: MetaApiService,
    private manualInstagramService: ManualInstagramService,
  ) {}

  async create(
    createInstagramPostDto: CreateInstagramPostDto,
  ): Promise<InstagramPostDocument> {
    try {
      this.logger.log(
        `Creating Instagram post for order: ${createInstagramPostDto.orderId}`,
      );

      // Validate orderId format
      if (!Types.ObjectId.isValid(createInstagramPostDto.orderId)) {
        throw new BadRequestException('Invalid order ID format');
      }

      // Check if post already exists for this order
      const existingPost = await this.instagramPostModel.findOne({
        orderId: createInstagramPostDto.orderId,
        isDeleted: false,
      });

      if (existingPost) {
        throw new BadRequestException(
          'Instagram post already exists for this order',
        );
      }

      // Post to Instagram via Meta API
      let metaPostResult;
      let isSimulated = false;
      try {
        metaPostResult = await this.metaApiService.createInstagramPost(
          createInstagramPostDto.photoAfterUrl,
          createInstagramPostDto.caption,
        );

        // Check if this is a simulated post
        isSimulated = metaPostResult.id.startsWith('sim_');
        if (isSimulated) {
          this.logger.log('🎭 Post created in simulation mode');
        }
      } catch (metaError) {
        this.logger.error('Failed to post to Instagram:', metaError.message);

        // Check if it's a credential issue
        if (
          metaError.message.includes('Invalid Instagram access token') ||
          metaError.message.includes('Meta API credentials are invalid')
        ) {
          throw new BadRequestException(
            'Instagram API configuration error. Please check the INSTAGRAM_API_SETUP.md file for setup instructions. ' +
              'The current access token is invalid or expired.',
          );
        }

        throw new InternalServerErrorException(
          `Failed to post to Instagram: ${metaError.message}`,
        );
      }

      // Create post record in database
      const instagramPost = new this.instagramPostModel({
        ...createInstagramPostDto,
        postId: metaPostResult.id,
        publishedAt: new Date(),
        isPublish: true,
        isSimulated,
        simulationNote: isSimulated ? 'Created in simulation mode - not actually posted to Instagram' : null,
      });

      const savedPost = await instagramPost.save();
      
      if (isSimulated) {
        this.logger.log(
          `🎭 Simulated Instagram post created successfully with ID: ${savedPost.id}`,
        );
      } else {
        this.logger.log(
          `Instagram post created successfully with ID: ${savedPost.id}`,
        );
      }

      return savedPost;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      this.logger.error('Failed to create Instagram post:', error.message);
      throw new InternalServerErrorException('Failed to create Instagram post');
    }
  }

  async prepareManualPost(
    createInstagramPostDto: CreateInstagramPostDto,
  ): Promise<any> {
    try {
      this.logger.log(
        `Preparing manual Instagram post for order: ${createInstagramPostDto.orderId}`,
      );

      // Validate orderId format
      if (!Types.ObjectId.isValid(createInstagramPostDto.orderId)) {
        throw new BadRequestException('Invalid order ID format');
      }

      // Check if post already exists for this order
      const existingPost = await this.instagramPostModel.findOne({
        orderId: createInstagramPostDto.orderId,
        isDeleted: false,
      });

      if (existingPost) {
        throw new BadRequestException(
          'Instagram post already exists for this order',
        );
      }

      // Prepare manual posting instructions
      const preparation = await this.manualInstagramService.prepareManualPost(
        createInstagramPostDto.photoAfterUrl,
        createInstagramPostDto.caption,
      );

      // Create pending post record in database
      const instagramPost = new this.instagramPostModel({
        ...createInstagramPostDto,
        postId: preparation.id,
        publishedAt: null,
        isPublish: false,
        isSimulated: true,
        simulationNote: 'Manual posting preparation - waiting for user to post manually',
        status: 'pending_manual',
      });

      const savedPost = await instagramPost.save();
      
      this.logger.log(
        `🎭 Manual Instagram post preparation created: ${savedPost.id}`,
      );

      return {
        preparation,
        postRecord: savedPost,
        instructions: [
          '📱 Use the provided image and caption to post manually on Instagram',
          '🔗 After posting, come back and update with the Instagram post URL',
          '✅ The system will then track your post automatically',
        ],
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('Error preparing manual Instagram post:', error.message);
      throw new InternalServerErrorException('Failed to prepare manual Instagram post');
    }
  }

  async confirmManualPost(
    postId: string,
    instagramUrl: string,
  ): Promise<InstagramPostDocument> {
    try {
      this.logger.log(`Confirming manual post: ${postId} with URL: ${instagramUrl}`);

      const post = await this.instagramPostModel.findById(postId);
      if (!post) {
        throw new NotFoundException('Instagram post not found');
      }

      if (post.status !== 'pending_manual') {
        throw new BadRequestException('Post is not in pending manual status');
      }

      // Track the manual post
      const trackResult = await this.manualInstagramService.trackManualPost(
        post.postId,
        instagramUrl,
      );

      if (!trackResult.success) {
        throw new BadRequestException('Invalid Instagram URL provided');
      }

      // Update post record
      post.postId = trackResult.postId || post.postId;
      post.permalink = instagramUrl;
      post.publishedAt = new Date();
      post.isPublish = true;
      post.status = 'published';
      post.simulationNote = 'Manually posted and confirmed by user';

      const updatedPost = await post.save();
      
      this.logger.log(`✅ Manual post confirmed successfully: ${updatedPost.id}`);
      return updatedPost;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('Error confirming manual post:', error.message);
      throw new InternalServerErrorException('Failed to confirm manual post');
    }
  }

  async findAll(): Promise<InstagramPostDocument[]> {
    try {
      return await this.instagramPostModel
        .find({ isDeleted: false })
        .populate('orderId', 'uniqueCode status amount')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error('Failed to fetch Instagram posts:', error.message);
      throw new InternalServerErrorException('Failed to fetch Instagram posts');
    }
  }

  async findById(id: string): Promise<InstagramPostDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      const post = await this.instagramPostModel
        .findOne({ _id: id, isDeleted: false })
        .populate('orderId', 'uniqueCode status amount photoAfterUrl')
        .exec();

      if (!post) {
        throw new NotFoundException('Instagram post not found');
      }

      return post;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error('Failed to fetch Instagram post:', error.message);
      throw new InternalServerErrorException('Failed to fetch Instagram post');
    }
  }

  async findByOrderId(orderId: string): Promise<InstagramPostDocument[]> {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException('Invalid order ID format');
      }

      return await this.instagramPostModel
        .find({ orderId, isDeleted: false })
        .populate('orderId', 'uniqueCode status amount')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        'Failed to fetch Instagram posts by order ID:',
        error.message,
      );
      throw new InternalServerErrorException(
        'Failed to fetch Instagram posts by order ID',
      );
    }
  }

  async update(
    id: string,
    updateInstagramPostDto: UpdateInstagramPostDto,
  ): Promise<InstagramPostDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      const existingPost = await this.findById(id);

      // If updating order ID, validate it
      if (
        updateInstagramPostDto.orderId &&
        !Types.ObjectId.isValid(updateInstagramPostDto.orderId)
      ) {
        throw new BadRequestException('Invalid order ID format');
      }

      const updatedPost = await this.instagramPostModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateInstagramPostDto },
          { new: true },
        )
        .populate('orderId', 'uniqueCode status amount')
        .exec();

      if (!updatedPost) {
        throw new NotFoundException('Instagram post not found');
      }

      this.logger.log(`Instagram post updated successfully: ${id}`);
      return updatedPost;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error('Failed to update Instagram post:', error.message);
      throw new InternalServerErrorException('Failed to update Instagram post');
    }
  }

  async takedown(id: string, reason?: string): Promise<InstagramPostDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      const post = await this.findById(id);

      if (!post.isPublish) {
        throw new BadRequestException('Instagram post is not published');
      }

      if (post.takedownAt) {
        throw new BadRequestException(
          'Instagram post has already been taken down',
        );
      }

      // Delete post from Instagram via Meta API
      try {
        await this.metaApiService.deleteInstagramPost(post.postId);
        this.logger.log(`Instagram post taken down from Meta: ${post.postId}`);
      } catch (metaError) {
        this.logger.error(
          'Failed to takedown from Instagram:',
          metaError.message,
        );
        // Continue with database update even if Meta API fails
      }

      // Update database record
      const updatedPost = await this.instagramPostModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          {
            $set: {
              takedownAt: new Date(),
              isPublish: false,
            },
          },
          { new: true },
        )
        .populate('orderId', 'uniqueCode status amount')
        .exec();

      if (!updatedPost) {
        throw new NotFoundException('Instagram post not found');
      }

      this.logger.log(`Instagram post taken down successfully: ${id}`);
      return updatedPost;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error('Failed to takedown Instagram post:', error.message);
      throw new InternalServerErrorException(
        'Failed to takedown Instagram post',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      const post = await this.findById(id);

      // If post is still published, take it down first
      if (post.isPublish && !post.takedownAt) {
        await this.takedown(id, 'Post deleted');
      }

      // Soft delete
      const deletedPost = await this.instagramPostModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
            },
          },
          { new: true },
        )
        .exec();

      if (!deletedPost) {
        throw new NotFoundException('Instagram post not found');
      }

      this.logger.log(`Instagram post soft deleted: ${id}`);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error('Failed to delete Instagram post:', error.message);
      throw new InternalServerErrorException('Failed to delete Instagram post');
    }
  }

  async restore(id: string): Promise<InstagramPostDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      const restoredPost = await this.instagramPostModel
        .findOneAndUpdate(
          { _id: id, isDeleted: true },
          {
            $set: {
              isDeleted: false,
              deletedAt: null,
            },
          },
          { new: true },
        )
        .populate('orderId', 'uniqueCode status amount')
        .exec();

      if (!restoredPost) {
        throw new NotFoundException('Instagram post not found or not deleted');
      }

      this.logger.log(`Instagram post restored: ${id}`);
      return restoredPost;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error('Failed to restore Instagram post:', error.message);
      throw new InternalServerErrorException(
        'Failed to restore Instagram post',
      );
    }
  }

  async getStats(): Promise<{
    total: number;
    published: number;
    takenDown: number;
    deleted: number;
  }> {
    try {
      const [total, published, takenDown, deleted] = await Promise.all([
        this.instagramPostModel.countDocuments({ isDeleted: false }),
        this.instagramPostModel.countDocuments({
          isDeleted: false,
          isPublish: true,
        }),
        this.instagramPostModel.countDocuments({
          isDeleted: false,
          takedownAt: { $ne: null },
        }),
        this.instagramPostModel.countDocuments({ isDeleted: true }),
      ]);

      return { total, published, takenDown, deleted };
    } catch (error) {
      this.logger.error('Failed to get Instagram post stats:', error.message);
      throw new InternalServerErrorException(
        'Failed to get Instagram post stats',
      );
    }
  }
}
