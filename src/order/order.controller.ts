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
  UseInterceptors,
  UploadedFiles,
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderResponseDto,
  UpdatePhotoDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@ApiTags('Order')
@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    try {
      if (!createOrderDto.serviceId) {
        throw new BadRequestException('Service ID is required');
      }

      if (!createOrderDto.amount || createOrderDto.amount < 0) {
        throw new BadRequestException(
          'Valid amount is required and must be positive',
        );
      }

      const order = await this.orderService.create(createOrderDto);
      const populated = await this.orderService.findById(order.id);

      return {
        message: 'Order created successfully',
        status: 'success',
        code: HttpStatus.CREATED,
        data: this.formatOrderResponse(populated),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new BadRequestException('Duplicate order detected');
      }
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async findAll() {
    try {
      const orders = await this.orderService.findAll();

      return {
        message: 'Orders fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: orders.map((order) => this.formatOrderResponse(order)),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async findById(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const order = await this.orderService.findById(id);

      return {
        message: 'Order fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatOrderResponse(order),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

  @Get('group/:groupId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get orders by group ID' })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async findByGroupId(@Param('groupId') groupId: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(groupId)) {
        throw new BadRequestException('Invalid group ID format');
      }

      const orders = await this.orderService.findByGroupId(groupId);

      return {
        message: 'Orders fetched successfully by group ID',
        status: 'success',
        code: HttpStatus.OK,
        data: orders.map((order) => this.formatOrderResponse(order)),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch orders by group ID',
      );
    }
  }

  @Public()
  @Get('my-order/:groupId/unique-code/:uniqueCode')
  @ApiOperation({
    summary: 'Get my orders by group ID and unique code (no auth required)',
  })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async findMyOrders(
    @Param('groupId') groupId: string,
    @Param('uniqueCode') uniqueCode: string,
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(groupId)) {
        throw new BadRequestException('Invalid group ID format');
      }

      if (!uniqueCode || uniqueCode.trim().length === 0) {
        throw new BadRequestException('Unique code is required');
      }

      const orders = await this.orderService.findMyOrdersByGroupAndUniqueCode(
        groupId,
        uniqueCode,
      );

      return {
        message: 'My orders fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: orders.map((order) => this.formatOrderResponse(order)),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch my orders');
    }
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      if (Object.keys(updateOrderDto).length === 0) {
        throw new BadRequestException(
          'At least one field must be provided for update',
        );
      }

      if (updateOrderDto.amount !== undefined && updateOrderDto.amount < 0) {
        throw new BadRequestException('Amount must be positive');
      }

      const order = await this.orderService.update(id, updateOrderDto);

      return {
        message: 'Order updated successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatOrderResponse(order),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update order');
    }
  }

  @Post(':id/photos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload photos (before and/or after)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdatePhotoDto })
  @UseInterceptors(FilesInterceptor('photos', 2))
  async uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updatePhotoDto: UpdatePhotoDto,
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      if (!files || files.length === 0) {
        throw new BadRequestException('At least one photo file is required');
      }

      if (files.length > 2) {
        throw new BadRequestException('Maximum 2 photos allowed');
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024;

      for (const file of files) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            'Only JPEG, PNG, and JPG files are allowed',
          );
        }

        if (file.size > maxSize) {
          throw new BadRequestException('File size must be less than 5MB');
        }
      }

      const fileObj: {
        photoBefore?: Express.Multer.File;
        photoAfter?: Express.Multer.File;
      } = {};

      for (const file of files) {
        if (file.fieldname === 'photoBefore') {
          fileObj.photoBefore = file;
        } else if (file.fieldname === 'photoAfter') {
          fileObj.photoAfter = file;
        }
      }

      const order = await this.orderService.uploadPhotos(id, fileObj);

      return {
        message: 'Photos uploaded successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatOrderResponse(order),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload photos');
    }
  }

  @Patch(':id/photos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update photos (before and/or after)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdatePhotoDto })
  @UseInterceptors(FilesInterceptor('photos', 2))
  async updatePhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updatePhotoDto: UpdatePhotoDto,
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      if (!files || files.length === 0) {
        throw new BadRequestException('At least one photo file is required');
      }

      if (files.length > 2) {
        throw new BadRequestException('Maximum 2 photos allowed');
      }

      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024;

      for (const file of files) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            'Only JPEG, PNG, and JPG files are allowed',
          );
        }

        if (file.size > maxSize) {
          throw new BadRequestException('File size must be less than 5MB');
        }
      }

      const fileObj: {
        photoBefore?: Express.Multer.File;
        photoAfter?: Express.Multer.File;
      } = {};

      for (const file of files) {
        if (file.fieldname === 'photoBefore') {
          fileObj.photoBefore = file;
        } else if (file.fieldname === 'photoAfter') {
          fileObj.photoAfter = file;
        }
      }

      const order = await this.orderService.uploadPhotos(id, fileObj);

      return {
        message: 'Photos updated successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatOrderResponse(order),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update photos');
    }
  }

  @Delete(':id/photos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete photos (before and/or after)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deletePhotoBefore: { type: 'boolean' },
        deletePhotoAfter: { type: 'boolean' },
      },
    },
  })
  async deletePhotos(
    @Param('id') id: string,
    @Body() body: { deletePhotoBefore?: boolean; deletePhotoAfter?: boolean },
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      if (!body.deletePhotoBefore && !body.deletePhotoAfter) {
        throw new BadRequestException(
          'At least one photo type must be specified for deletion',
        );
      }

      let photoType: 'before' | 'after' | 'both';
      if (body.deletePhotoBefore && body.deletePhotoAfter) {
        photoType = 'both';
      } else if (body.deletePhotoBefore) {
        photoType = 'before';
      } else {
        photoType = 'after';
      }

      const order = await this.orderService.deletePhotos(id, photoType);

      return {
        message: 'Photos deleted successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatOrderResponse(order),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete photos');
    }
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete order' })
  async remove(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      await this.orderService.remove(id);

      return {
        message: 'Order deleted successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete order');
    }
  }

  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore deleted order' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async restore(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const order = await this.orderService.restore(id);

      return {
        message: 'Order restored successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.formatOrderResponse(order),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to restore order');
    }
  }

  private formatOrderResponse(order: any): any {
    return {
      id: order.id,
      uniqueCode: order.uniqueCode,
      orderGroupId: order.orderGroupId?.toString() || null,
      serviceId: order.serviceId._id?.toString() || order.serviceId.toString(),
      serviceName: order.serviceId.name || 'Unknown Service',
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      pickupDelivery: order.pickupDelivery,
      pickupNote: order.pickupNote,
      startDate: order.startDate,
      endDate: order.endDate,
      amount: order.amount,
      photoBefore: order.photoBefore,
      photoBeforeId: order.photoBeforeId,
      photoAfter: order.photoAfter,
      photoAfterId: order.photoAfterId,
      serviceNote: order.serviceNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
