import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from './service.schema';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { CategoryServiceService } from '../category-service/category-service.service';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name)
    private serviceModel: Model<ServiceDocument>,
    private categoryServiceService: CategoryServiceService,
  ) {}

  async create(createDto: CreateServiceDto): Promise<ServiceDocument> {
    await this.categoryServiceService.findById(createDto.categoryId);

    const created = new this.serviceModel(createDto);
    return created.save();
  }

  async findAll(): Promise<ServiceDocument[]> {
    return this.serviceModel
      .find({ deletedAt: null })
      .populate('categoryId', 'name')
      .exec();
  }

  async findById(id: string): Promise<ServiceDocument> {
    const service = await this.serviceModel
      .findOne({ _id: id, deletedAt: null })
      .populate('categoryId', 'name')
      .exec();

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findByCategoryId(categoryId: string): Promise<ServiceDocument[]> {
    return this.serviceModel
      .find({ categoryId, deletedAt: null })
      .populate('categoryId', 'name')
      .exec();
  }

  async update(
    id: string,
    updateDto: UpdateServiceDto,
  ): Promise<ServiceDocument> {
    if (updateDto.categoryId) {
      await this.categoryServiceService.findById(updateDto.categoryId);
    }

    const updated = await this.serviceModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, updateDto, { new: true })
      .populate('categoryId', 'name')
      .exec();

    if (!updated) {
      throw new NotFoundException('Service not found');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.serviceModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Service not found');
    }
  }

  async restore(id: string): Promise<ServiceDocument> {
    const restored = await this.serviceModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true },
      )
      .populate('categoryId', 'name')
      .exec();

    if (!restored) {
      throw new NotFoundException('Service not found or not deleted');
    }

    return restored;
  }
}
