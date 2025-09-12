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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionCategoryService } from './transaction-category.service';
import {
  CreateTransactionCategoryDto,
  TransactionCategoryResponseDto,
  UpdateTransactionCategoryDto,
} from './dto/transaction-category.dto';

@ApiTags('Transaction Category')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('transaction-category')
export class TransactionCategoryController {
  constructor(private readonly service: TransactionCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction category' })
  @ApiResponse({ status: 201, type: TransactionCategoryResponseDto })
  async create(@Body() dto: CreateTransactionCategoryDto) {
    try {
      if (!dto.name || dto.name.trim() === '')
        throw new BadRequestException('Category name is required');
      const created = await this.service.create(dto);
      return {
        message: 'Transaction category created successfully',
        status: 'success',
        code: HttpStatus.CREATED,
        data: {
          id: created.id,
          name: created.name,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).code === 11000)
        throw new BadRequestException('Category with this name already exists');
      if ((error as any).name === 'ValidationError')
        throw new BadRequestException(`Validation failed: ${(error as any).message}`);
      throw new InternalServerErrorException('Failed to create transaction category');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all transaction categories' })
  @ApiResponse({ status: 200, type: [TransactionCategoryResponseDto] })
  async findAll() {
    try {
      const list = await this.service.findAll();
      return {
        message: 'Transaction categories fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: list.map((i) => ({
          id: i.id,
          name: i.name,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch transaction categories');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction category by ID' })
  @ApiResponse({ status: 200, type: TransactionCategoryResponseDto })
  async findById(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        throw new BadRequestException('Invalid category ID format');
      const item = await this.service.findById(id);
      if (!item) throw new NotFoundException('Transaction category not found');
      return {
        message: 'Transaction category fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: item.id,
          name: item.name,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid category ID format');
      throw new InternalServerErrorException('Failed to fetch transaction category');
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction category' })
  @ApiResponse({ status: 200, type: TransactionCategoryResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTransactionCategoryDto) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        throw new BadRequestException('Invalid category ID format');
      if (Object.keys(dto).length === 0)
        throw new BadRequestException('At least one field must be provided for update');
      if (dto.name !== undefined && (!dto.name || dto.name.trim() === ''))
        throw new BadRequestException('Category name cannot be empty');
      const updated = await this.service.update(id, dto);
      return {
        message: 'Transaction category updated successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: updated.id,
          name: updated.name,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).code === 11000)
        throw new BadRequestException('Category with this name already exists');
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid category ID format');
      if ((error as any).name === 'ValidationError')
        throw new BadRequestException(`Validation failed: ${(error as any).message}`);
      throw new InternalServerErrorException('Failed to update transaction category');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete transaction category' })
  async remove(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        throw new BadRequestException('Invalid category ID format');
      await this.service.findById(id);
      await this.service.remove(id);
      return {
        message: 'Transaction category deleted successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: null,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid category ID format');
      throw new InternalServerErrorException('Failed to delete transaction category');
    }
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore deleted transaction category' })
  @ApiResponse({ status: 200, type: TransactionCategoryResponseDto })
  async restore(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        throw new BadRequestException('Invalid category ID format');
      const restored = await this.service.restore(id);
      return {
        message: 'Transaction category restored successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: restored.id,
          name: restored.name,
          createdAt: restored.createdAt,
          updatedAt: restored.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any).name === 'CastError')
        throw new BadRequestException('Invalid category ID format');
      throw new InternalServerErrorException('Failed to restore transaction category');
    }
  }
}
