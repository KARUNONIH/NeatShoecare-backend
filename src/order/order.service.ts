import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './order.schema';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { GoogleDriveService } from './google-drive.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private googleDriveService: GoogleDriveService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    try {
      const orderData = {
        ...createOrderDto,
        serviceId: new Types.ObjectId(createOrderDto.serviceId),
        orderGroupId: createOrderDto.orderGroupId
          ? new Types.ObjectId(createOrderDto.orderGroupId)
          : null,
        uniqueCode: createOrderDto.uniqueCode,
        startDate: createOrderDto.startDate
          ? new Date(createOrderDto.startDate)
          : null,
        endDate: createOrderDto.endDate
          ? new Date(createOrderDto.endDate)
          : null,
      };

      const order = new this.orderModel(orderData);
      const savedOrder = await order.save();

      if (createOrderDto.orderGroupId) {
        await this.orderModel.updateMany(
          {
            orderGroupId: new Types.ObjectId(createOrderDto.orderGroupId),
            isDeleted: false,
          },
          {
            $set: { uniqueCode: createOrderDto.uniqueCode },
          },
        );
      }

      return savedOrder;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid ID format');
      }
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async findAll(): Promise<OrderDocument[]> {
    try {
      return await this.orderModel
        .find({ isDeleted: false })
        .populate('serviceId', 'name price description duration')
        .populate('orderGroupId', 'id')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async findById(id: string): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const order = await this.orderModel
        .findOne({ _id: id, isDeleted: false })
        .populate('serviceId', 'name price description duration')
        .populate('orderGroupId', 'id')
        .exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return order;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

  async findByGroupId(groupId: string): Promise<OrderDocument[]> {
    try {
      if (!Types.ObjectId.isValid(groupId)) {
        throw new BadRequestException('Invalid group ID format');
      }

      return await this.orderModel
        .find({ orderGroupId: groupId, isDeleted: false })
        .populate('serviceId', 'name price description duration')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch orders by group ID',
      );
    }
  }

  async findMyOrdersByGroupAndUniqueCode(
    groupId: string,
    uniqueCode: string,
  ): Promise<OrderDocument[]> {
    try {
      if (!Types.ObjectId.isValid(groupId)) {
        throw new BadRequestException('Invalid group ID format');
      }

      return await this.orderModel
        .find({
          orderGroupId: groupId,
          uniqueCode: uniqueCode,
          isDeleted: false,
        })
        .populate('serviceId', 'name price description duration')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch my orders');
    }
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const updateData: any = { ...updateOrderDto };

      if (updateOrderDto.serviceId) {
        updateData.serviceId = new Types.ObjectId(updateOrderDto.serviceId);
      }
      if (updateOrderDto.orderGroupId) {
        updateData.orderGroupId = new Types.ObjectId(
          updateOrderDto.orderGroupId,
        );
      }

      if (updateOrderDto.startDate) {
        updateData.startDate = new Date(updateOrderDto.startDate);
      }
      if (updateOrderDto.endDate) {
        updateData.endDate = new Date(updateOrderDto.endDate);
      }

      const updatedOrder = await this.orderModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { new: true, runValidators: true },
        )
        .populate('serviceId', 'name price description duration')
        .populate('orderGroupId', 'id')
        .exec();

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      return updatedOrder;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid ID format');
      }
      throw new InternalServerErrorException('Failed to update order');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const result = await this.orderModel
        .findOneAndUpdate(
          { _id: id, isDeleted: false },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
            },
          },
        )
        .exec();

      if (!result) {
        throw new NotFoundException('Order not found');
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete order');
    }
  }

  async restore(id: string): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const restoredOrder = await this.orderModel
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
        .populate('serviceId', 'name price description duration')
        .populate('orderGroupId', 'id')
        .exec();

      if (!restoredOrder) {
        throw new NotFoundException('Order not found or not deleted');
      }

      return restoredOrder;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to restore order');
    }
  }

  async uploadPhotos(
    orderId: string,
    files: {
      photoBefore?: Express.Multer.File;
      photoAfter?: Express.Multer.File;
    },
  ): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const order = await this.findById(orderId);
      const updateData: any = {};

      if (files.photoBefore) {
        const oldFileNameBefore = `${orderId}_before`;
        await this.googleDriveService.deleteFileByName(oldFileNameBefore);

        const fileNameBefore = `${orderId}_before.${files.photoBefore.originalname.split('.').pop()}`;
        const uploadResultBefore = await this.googleDriveService.uploadFile(
          files.photoBefore,
          fileNameBefore,
        );

        updateData.photoBefore = uploadResultBefore.webViewLink;
        updateData.photoBeforeId = uploadResultBefore.fileId;
      }

      if (files.photoAfter) {
        const oldFileNameAfter = `${orderId}_after`;
        await this.googleDriveService.deleteFileByName(oldFileNameAfter);

        const fileNameAfter = `${orderId}_after.${files.photoAfter.originalname.split('.').pop()}`;
        const uploadResultAfter = await this.googleDriveService.uploadFile(
          files.photoAfter,
          fileNameAfter,
        );

        updateData.photoAfter = uploadResultAfter.webViewLink;
        updateData.photoAfterId = uploadResultAfter.fileId;
      }

      const updatedOrder = await this.orderModel
        .findOneAndUpdate(
          { _id: orderId, isDeleted: false },
          { $set: updateData },
          { new: true },
        )
        .populate('serviceId', 'name price description duration')
        .populate('orderGroupId', 'id')
        .exec();

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      return updatedOrder;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload photos');
    }
  }

  async deletePhotos(
    orderId: string,
    photoType: 'before' | 'after' | 'both',
  ): Promise<OrderDocument> {
    try {
      if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestException('Invalid order ID format');
      }

      const order = await this.findById(orderId);
      const updateData: any = {};

      if (photoType === 'before' || photoType === 'both') {
        const fileNameBefore = `${orderId}_before`;
        await this.googleDriveService.deleteFileByName(fileNameBefore);

        updateData.photoBefore = null;
        updateData.photoBeforeId = null;
      }

      if (photoType === 'after' || photoType === 'both') {
        const fileNameAfter = `${orderId}_after`;
        await this.googleDriveService.deleteFileByName(fileNameAfter);

        updateData.photoAfter = null;
        updateData.photoAfterId = null;
      }

      const updatedOrder = await this.orderModel
        .findOneAndUpdate(
          { _id: orderId, isDeleted: false },
          { $set: updateData },
          { new: true },
        )
        .populate('serviceId', 'name price description duration')
        .populate('orderGroupId', 'id')
        .exec();

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      return updatedOrder;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete photos');
    }
  }
}
