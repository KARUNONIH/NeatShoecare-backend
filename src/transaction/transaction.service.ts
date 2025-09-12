import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from './transaction.schema';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { TransactionCategoryService } from '../transaction-category/transaction-category.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private transactionCategoryService: TransactionCategoryService,
  ) {}

  async create(dto: CreateTransactionDto): Promise<TransactionDocument> {
  // Validate category existence; will throw NotFoundException if not found
  await this.transactionCategoryService.findById(dto.categoryId);
    const doc = new this.transactionModel({
      ...dto,
      date: new Date(dto.date),
    });
    try {
      return await doc.save();
    } catch (err) {
      // Re-throw for controller to map into 400/500
      throw err;
    }
  }

  async findAll(filter?: { type?: TransactionType; categoryId?: string; startDate?: string; endDate?: string }): Promise<TransactionDocument[]> {
    const query: FilterQuery<TransactionDocument> = { deletedAt: null } as any;
    if (filter?.type) query.type = filter.type;
    if (filter?.categoryId) query.categoryId = filter.categoryId;
    if (filter?.startDate || filter?.endDate) {
      query.date = {} as any;
      if (filter.startDate) (query.date as any).$gte = new Date(filter.startDate);
      if (filter.endDate) (query.date as any).$lte = new Date(filter.endDate);
    }
    return this.transactionModel
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('categoryId', 'name')
      .exec();
  }

  async findById(id: string): Promise<TransactionDocument> {
    const item = await this.transactionModel
      .findOne({ _id: id, deletedAt: null })
      .populate('categoryId', 'name')
      .exec();
    if (!item) throw new NotFoundException('Transaction not found');
    return item;
  }

  async update(id: string, dto: UpdateTransactionDto): Promise<TransactionDocument> {
    if (dto.categoryId) {
      await this.transactionCategoryService.findById(dto.categoryId);
    }
    const updated = await this.transactionModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { ...dto, ...(dto.date ? { date: new Date(dto.date) } : {}) },
        { new: true },
      )
      .populate('categoryId', 'name')
      .exec();
    if (!updated) throw new NotFoundException('Transaction not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.transactionModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!res) throw new NotFoundException('Transaction not found');
  }

  async restore(id: string): Promise<TransactionDocument> {
    const restored = await this.transactionModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true },
      )
      .populate('categoryId', 'name')
      .exec();
    if (!restored) throw new NotFoundException('Transaction not found or not deleted');
    return restored;
  }
}
