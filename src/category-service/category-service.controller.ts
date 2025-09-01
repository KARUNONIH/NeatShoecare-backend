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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoryServiceService } from './category-service.service';
import {
  CreateCategoryServiceDto,
  UpdateCategoryServiceDto,
  CategoryServiceResponseDto,
} from './dto/category-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Category Service')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('category-service')
export class CategoryServiceController {
  constructor(
    private readonly categoryServiceService: CategoryServiceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category service' })
  @ApiResponse({ status: 201, type: CategoryServiceResponseDto })
  async create(@Body() createDto: CreateCategoryServiceDto) {
    try {
      if (!createDto.name || createDto.name.trim() === '') {
        throw new BadRequestException(
          'Category name is required and cannot be empty',
        );
      }

      const categoryService =
        await this.categoryServiceService.create(createDto);
      if (!categoryService) {
        throw new InternalServerErrorException(
          'Failed to create category service',
        );
      }

      return {
        message: 'Category service created successfully',
        status: 'success',
        code: HttpStatus.CREATED,
        data: {
          id: categoryService.id,
          name: categoryService.name,
          createdAt: categoryService.createdAt,
          updatedAt: categoryService.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new BadRequestException(
          'Category service with this name already exists',
        );
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      throw new InternalServerErrorException(
        'Failed to create category service',
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all category services' })
  @ApiResponse({ status: 200, type: [CategoryServiceResponseDto] })
  async findAll() {
    try {
      const categoryServices = await this.categoryServiceService.findAll();

      return {
        message: 'Category services fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: categoryServices.map((item) => ({
          id: item.id,
          name: item.name,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch category services',
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category service by ID' })
  @ApiResponse({ status: 200, type: CategoryServiceResponseDto })
  async findById(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid category service ID format');
      }

      const categoryService = await this.categoryServiceService.findById(id);
      if (!categoryService) {
        throw new NotFoundException('Category service not found');
      }

      return {
        message: 'Category service fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: categoryService.id,
          name: categoryService.name,
          createdAt: categoryService.createdAt,
          updatedAt: categoryService.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid category service ID format');
      }
      throw new InternalServerErrorException(
        'Failed to fetch category service',
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category service' })
  @ApiResponse({ status: 200, type: CategoryServiceResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryServiceDto,
  ) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid category service ID format');
      }

      if (Object.keys(updateDto).length === 0) {
        throw new BadRequestException(
          'At least one field must be provided for update',
        );
      }

      if (
        updateDto.name !== undefined &&
        (!updateDto.name || updateDto.name.trim() === '')
      ) {
        throw new BadRequestException('Category name cannot be empty');
      }

      const categoryService = await this.categoryServiceService.update(
        id,
        updateDto,
      );
      if (!categoryService) {
        throw new NotFoundException('Category service not found');
      }

      return {
        message: 'Category service updated successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: categoryService.id,
          name: categoryService.name,
          createdAt: categoryService.createdAt,
          updatedAt: categoryService.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new BadRequestException(
          'Category service with this name already exists',
        );
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid category service ID format');
      }
      throw new InternalServerErrorException(
        'Failed to update category service',
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete category service' })
  async remove(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid category service ID format');
      }

      const existingCategoryService =
        await this.categoryServiceService.findById(id);
      if (!existingCategoryService) {
        throw new NotFoundException('Category service not found');
      }

      await this.categoryServiceService.remove(id);

      return {
        message: 'Category service deleted successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid category service ID format');
      }
      throw new InternalServerErrorException(
        'Failed to delete category service',
      );
    }
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore deleted category service' })
  @ApiResponse({ status: 200, type: CategoryServiceResponseDto })
  async restore(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid category service ID format');
      }

      const categoryService = await this.categoryServiceService.restore(id);
      if (!categoryService) {
        throw new NotFoundException(
          'Category service not found or not deleted',
        );
      }

      return {
        message: 'Category service restored successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: categoryService.id,
          name: categoryService.name,
          createdAt: categoryService.createdAt,
          updatedAt: categoryService.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid category service ID format');
      }
      throw new InternalServerErrorException(
        'Failed to restore category service',
      );
    }
  }
}
