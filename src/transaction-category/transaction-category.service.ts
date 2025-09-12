import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TransactionCategory,
  TransactionCategoryDocument,
} from './transaction-category.schema';
import {
  CreateTransactionCategoryDto,
  UpdateTransactionCategoryDto,
} from './dto/transaction-category.dto';

@Injectable()
export class TransactionCategoryService {
  constructor(
    @InjectModel(TransactionCategory.name)
    private transactionCategoryModel: Model<TransactionCategoryDocument>,
  ) {}

  async create(
    createDto: CreateTransactionCategoryDto,
  ): Promise<TransactionCategoryDocument> {
    const created = new this.transactionCategoryModel(createDto);
    return created.save();
  }

  async findAll(): Promise<TransactionCategoryDocument[]> {
    return this.transactionCategoryModel.find({ deletedAt: null }).exec();
  }

  async findById(id: string): Promise<TransactionCategoryDocument> {
    const item = await this.transactionCategoryModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
    if (!item) throw new NotFoundException('Transaction category not found');
    return item;
  }

  async update(
    id: string,
    updateDto: UpdateTransactionCategoryDto,
  ): Promise<TransactionCategoryDocument> {
    const updated = await this.transactionCategoryModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, updateDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Transaction category not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.transactionCategoryModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!result) throw new NotFoundException('Transaction category not found');
  }

  async restore(id: string): Promise<TransactionCategoryDocument> {
    const restored = await this.transactionCategoryModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true },
      )
      .exec();
    if (!restored)
      throw new NotFoundException('Transaction category not found or not deleted');
    return restored;
  }
}
