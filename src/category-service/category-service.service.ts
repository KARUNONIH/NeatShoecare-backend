import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CategoryService,
  CategoryServiceDocument,
} from './category-service.schema';
import {
  CreateCategoryServiceDto,
  UpdateCategoryServiceDto,
} from './dto/category-service.dto';

@Injectable()
export class CategoryServiceService {
  constructor(
    @InjectModel(CategoryService.name)
    private categoryServiceModel: Model<CategoryServiceDocument>,
  ) {}

  async create(
    createDto: CreateCategoryServiceDto,
  ): Promise<CategoryServiceDocument> {
    const created = new this.categoryServiceModel(createDto);
    return created.save();
  }

  async findAll(): Promise<CategoryServiceDocument[]> {
    return this.categoryServiceModel.find({ deletedAt: null }).exec();
  }

  async findById(id: string): Promise<CategoryServiceDocument> {
    const categoryService = await this.categoryServiceModel
      .findOne({ _id: id, deletedAt: null })
      .exec();

    if (!categoryService) {
      throw new NotFoundException('Category service not found');
    }

    return categoryService;
  }

  async update(
    id: string,
    updateDto: UpdateCategoryServiceDto,
  ): Promise<CategoryServiceDocument> {
    const updated = await this.categoryServiceModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, updateDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Category service not found');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryServiceModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Category service not found');
    }
  }

  async restore(id: string): Promise<CategoryServiceDocument> {
    const restored = await this.categoryServiceModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true },
      )
      .exec();

    if (!restored) {
      throw new NotFoundException('Category service not found or not deleted');
    }

    return restored;
  }
}
