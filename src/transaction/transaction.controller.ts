import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, TransactionResponseDto, UpdateTransactionDto } from './dto/transaction.dto';
import { TransactionType } from './transaction.schema';

@ApiTags('Transaction')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  private format(item: any) {
    const categoryPop = item?.categoryId;
    const categoryIdStr =
      (categoryPop && categoryPop._id && categoryPop._id.toString()) ||
      (typeof categoryPop === 'string' ? categoryPop : undefined) ||
      (categoryPop?.toString?.());
    const categoryName = typeof categoryPop === 'object' ? categoryPop?.name : undefined;
    return {
      id: item.id,
      type: item.type,
      date: item.date,
      description: item.description,
      amount: item.amount,
      categoryId: categoryIdStr,
      category: categoryName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  async create(@Body() dto: CreateTransactionDto) {
    try {
      if (!dto.type || !dto.date || dto.amount === undefined || !dto.categoryId) {
        throw new BadRequestException('type, date, amount, and categoryId are required');
      }
      const created = await this.service.create(dto);
      const populated = await this.service.findById(created.id);
      return {
        message: 'Transaction created successfully',
        status: 'success',
        code: HttpStatus.CREATED,
        data: this.format(populated),
      };
    } catch (error) {
  // Log the underlying error for debugging
  // eslint-disable-next-line no-console
  console.error('Create Transaction Error:', error);
      if (error instanceof HttpException) throw error;
      if ((error as any).name === 'ValidationError')
        throw new BadRequestException(`Validation failed: ${(error as any).message}`);
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid category ID format');
      if ((error as any).message?.includes('Transaction category not found'))
        throw new NotFoundException('Transaction category not found');
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by transaction category ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO date string YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO date string YYYY-MM-DD' })
  async findAll(
    @Query('type') type?: TransactionType,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      if (categoryId && !/^[0-9a-fA-F]{24}$/.test(categoryId))
        throw new BadRequestException('Invalid category ID format');
      if (startDate && isNaN(Date.parse(startDate)))
        throw new BadRequestException('Invalid startDate format');
      if (endDate && isNaN(Date.parse(endDate)))
        throw new BadRequestException('Invalid endDate format');

      const data = await this.service.findAll({ type, categoryId, startDate, endDate });
      return {
        message: 'Transactions fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: data.map((i) => this.format(i)),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch transactions');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async findById(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        throw new BadRequestException('Invalid transaction ID format');
      const item = await this.service.findById(id);
      if (!item) throw new NotFoundException('Transaction not found');
      return {
        message: 'Transaction fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.format(item),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid transaction ID format');
      throw new InternalServerErrorException('Failed to fetch transaction');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        throw new BadRequestException('Invalid transaction ID format');
      if (Object.keys(dto).length === 0)
        throw new BadRequestException('At least one field must be provided for update');
      const updated = await this.service.update(id, dto);
      return {
        message: 'Transaction updated successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.format(updated),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).name === 'ValidationError')
        throw new BadRequestException(`Validation failed: ${(error as any).message}`);
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid ID format');
      throw new InternalServerErrorException('Failed to update transaction');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete transaction' })
  async remove(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        throw new BadRequestException('Invalid transaction ID format');
      await this.service.findById(id);
      await this.service.remove(id);
      return {
        message: 'Transaction deleted successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: null,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid transaction ID format');
      throw new InternalServerErrorException('Failed to delete transaction');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore deleted transaction' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async restore(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        throw new BadRequestException('Invalid transaction ID format');
      const restored = await this.service.restore(id);
      return {
        message: 'Transaction restored successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: this.format(restored),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid transaction ID format');
      throw new InternalServerErrorException('Failed to restore transaction');
    }
  }
}
