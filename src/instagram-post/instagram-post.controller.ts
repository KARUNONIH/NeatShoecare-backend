import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InstagramPostService } from './instagram-post.service';
import { MetaApiService } from './meta-api.service';
import { Public } from '../auth/public.decorator';
import {
  CreateInstagramPostDto,
  UpdateInstagramPostDto,
  TakedownInstagramPostDto,
  InstagramPostResponseDto,
} from './dto/instagram-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Instagram Post')
@Controller('instagram-post')
@UseGuards(JwtAuthGuard)
export class InstagramPostController {
  private readonly logger = new Logger(InstagramPostController.name);

  constructor(
    private readonly instagramPostService: InstagramPostService,
    private readonly metaApiService: MetaApiService,
  ) {}

  @Get('test-meta-api')
  @Public()
  async testMetaApi() {
    try {
      const mode = process.env.INSTAGRAM_MODE || 'production';
      const isValid = await this.metaApiService.validateCredentials();
      
      return {
        success: true,
        mode: mode,
        valid: isValid,
        message: mode === 'simulation' 
          ? '🎭 Simulation mode is active - Instagram posts will be simulated'
          : isValid 
            ? 'Meta API credentials are valid' 
            : 'Meta API credentials are invalid. Please check INSTAGRAM_API_SETUP.md for setup instructions.',
        note: mode === 'simulation' 
          ? 'All Instagram operations will be simulated. No actual posts will be made to Instagram.'
          : null
      };
    } catch (error) {
      return {
        success: false,
        mode: process.env.INSTAGRAM_MODE || 'production',
        valid: false,
        message: error.message,
        error: error.response?.data || 'Unknown error'
      };
    }
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new Instagram post and publish to Instagram',
  })
  @ApiResponse({ status: 201, type: InstagramPostResponseDto })
  async create(@Body() createInstagramPostDto: CreateInstagramPostDto) {
    try {
      if (!createInstagramPostDto.orderId) {
        throw new BadRequestException('Order ID is required');
      }

      if (!createInstagramPostDto.photoAfterUrl) {
        throw new BadRequestException('Photo after URL is required');
      }

      if (
        !createInstagramPostDto.caption ||
        createInstagramPostDto.caption.trim().length === 0
      ) {
        throw new BadRequestException('Caption is required');
      }

      const post = await this.instagramPostService.create(
        createInstagramPostDto,
      );

      return {
        message: 'Instagram post created and published successfully',
        status: 'success',
        code: HttpStatus.CREATED,
        data: this.formatPostResponse(post),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create Instagram post');
    }
  }

  @Post('prepare-manual')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Prepare manual Instagram post with instructions',
  })
  async prepareManualPost(@Body() createInstagramPostDto: CreateInstagramPostDto) {
    try {
      const result = await this.instagramPostService.prepareManualPost(createInstagramPostDto);
      
      return {
        success: true,
        message: 'Manual Instagram post preparation ready',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error preparing manual post:', error.message);
      throw error;
    }
  }

  @Post(':id/confirm-manual')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm manual Instagram post with actual Instagram URL',
  })
  async confirmManualPost(
    @Param('id') id: string,
    @Body() body: { instagramUrl: string },
  ) {
    try {
      const result = await this.instagramPostService.confirmManualPost(
        id,
        body.instagramUrl,
      );
      
      return {
        success: true,
        message: 'Manual Instagram post confirmed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error confirming manual post:', error.message);
      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all Instagram posts' })
  @ApiResponse({ status: 200, type: [InstagramPostResponseDto] })
  async findAll() {
    try {
      const posts = await this.instagramPostService.findAll();

      return {
        message: 'Instagram posts fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: posts.map((post) => this.formatPostResponse(post)),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch Instagram posts');
    }
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Instagram posts statistics' })
  async getStats() {
    try {
      const stats = await this.instagramPostService.getStats();

      return {
        message: 'Instagram post statistics fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: stats,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch Instagram post statistics',
      );
    }
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Instagram posts by order ID' })
  @ApiResponse({ status: 200, type: [InstagramPostResponseDto] })
  async findByOrderId(@Param('orderId') orderId: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const posts = await this.instagramPostService.findByOrderId(orderId);

      return {
        message: 'Instagram posts fetched successfully by order ID',
        status: 'success',
        code: HttpStatus.OK,
        data: posts.map((post) => this.formatPostResponse(post)),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch Instagram posts by order ID',
      );
    }
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Instagram post by ID' })
  @ApiResponse({ status: 200, type: InstagramPostResponseDto })
  async findById(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      const post = await this.instagramPostService.findById(id);

      return {
        message: 'Instagram post fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatPostResponse(post),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch Instagram post');
    }
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Instagram post' })
  @ApiResponse({ status: 200, type: InstagramPostResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateInstagramPostDto: UpdateInstagramPostDto,
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      if (Object.keys(updateInstagramPostDto).length === 0) {
        throw new BadRequestException(
          'At least one field must be provided for update',
        );
      }

      const post = await this.instagramPostService.update(
        id,
        updateInstagramPostDto,
      );

      return {
        message: 'Instagram post updated successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatPostResponse(post),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update Instagram post');
    }
  }

  @Post(':id/takedown')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Takedown Instagram post from Instagram platform' })
  @ApiResponse({ status: 200, type: InstagramPostResponseDto })
  async takedown(
    @Param('id') id: string,
    @Body() takedownDto: TakedownInstagramPostDto,
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      const post = await this.instagramPostService.takedown(
        id,
        takedownDto.reason,
      );

      return {
        message: 'Instagram post taken down successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatPostResponse(post),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to takedown Instagram post',
      );
    }
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete Instagram post' })
  async remove(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      await this.instagramPostService.remove(id);

      return {
        message: 'Instagram post deleted successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete Instagram post');
    }
  }

  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore deleted Instagram post' })
  @ApiResponse({ status: 200, type: InstagramPostResponseDto })
  async restore(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid Instagram post ID format');
      }

      const post = await this.instagramPostService.restore(id);

      return {
        message: 'Instagram post restored successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatPostResponse(post),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to restore Instagram post',
      );
    }
  }

  private formatPostResponse(post: any): any {
    return {
      id: post.id,
      postId: post.postId,
      orderId: post.orderId._id?.toString() || post.orderId.toString(),
      orderUniqueCode: post.orderId.uniqueCode || null,
      orderStatus: post.orderId.status || null,
      orderAmount: post.orderId.amount || null,
      photoAfterUrl: post.photoAfterUrl,
      caption: post.caption,
      publishedAt: post.publishedAt,
      takedownAt: post.takedownAt,
      isPublish: post.isPublish,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
