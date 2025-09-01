import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServiceService } from './service.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
} from './dto/service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Service')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, type: ServiceResponseDto })
  async create(@Body() createDto: CreateServiceDto) {
    try {
      if (!createDto.name || !createDto.categoryId || !createDto.price) {
        throw new BadRequestException(
          'Name, categoryId, and price are required fields',
        );
      }

      const service = await this.serviceService.create(createDto);
      const populated = await this.serviceService.findById(service.id);

      if (!populated) {
        throw new InternalServerErrorException(
          'Failed to retrieve created service',
        );
      }

      return {
        message: 'Service created successfully',
        status: 'success',
        code: HttpStatus.CREATED,
        data: {
          id: populated.id,
          name: populated.name,
          categoryId: populated.categoryId.toString(),
          category: (populated.categoryId as any).name,
          price: populated.price,
          description: populated.description,
          duration: populated.duration,
          createdAt: populated.createdAt,
          updatedAt: populated.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new BadRequestException('Service with this name already exists');
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid category ID format');
      }
      throw new InternalServerErrorException('Failed to create service');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, type: [ServiceResponseDto] })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  async findAll(@Query('categoryId') categoryId?: string) {
    try {
      let services;

      if (categoryId) {
        if (!/^[0-9a-fA-F]{24}$/.test(categoryId)) {
          throw new BadRequestException('Invalid category ID format');
        }
        services = await this.serviceService.findByCategoryId(categoryId);
      } else {
        services = await this.serviceService.findAll();
      }

      return {
        message: 'Services fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: services.map((service) => ({
          id: service.id,
          name: service.name,
          categoryId: service.categoryId.toString(),
          category: (service.categoryId as any).name,
          price: service.price,
          description: service.description,
          duration: service.duration,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch services');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, type: ServiceResponseDto })
  async findById(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid service ID format');
      }

      const service = await this.serviceService.findById(id);
      if (!service) {
        throw new NotFoundException('Service not found');
      }

      return {
        message: 'Service fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: service.id,
          name: service.name,
          categoryId: service.categoryId.toString(),
          category: (service.categoryId as any).name,
          price: service.price,
          description: service.description,
          duration: service.duration,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid service ID format');
      }
      throw new InternalServerErrorException('Failed to fetch service');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, type: ServiceResponseDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateServiceDto) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid service ID format');
      }

      if (Object.keys(updateDto).length === 0) {
        throw new BadRequestException(
          'At least one field must be provided for update',
        );
      }

      const service = await this.serviceService.update(id, updateDto);
      if (!service) {
        throw new NotFoundException('Service not found');
      }

      return {
        message: 'Service updated successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: service.id,
          name: service.name,
          categoryId: service.categoryId.toString(),
          category: (service.categoryId as any).name,
          price: service.price,
          description: service.description,
          duration: service.duration,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new BadRequestException('Service with this name already exists');
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid ID format');
      }
      throw new InternalServerErrorException('Failed to update service');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete service' })
  async remove(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid service ID format');
      }

      const existingService = await this.serviceService.findById(id);
      if (!existingService) {
        throw new NotFoundException('Service not found');
      }

      await this.serviceService.remove(id);

      return {
        message: 'Service deleted successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid service ID format');
      }
      throw new InternalServerErrorException('Failed to delete service');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore deleted service' })
  @ApiResponse({ status: 200, type: ServiceResponseDto })
  async restore(@Param('id') id: string) {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new BadRequestException('Invalid service ID format');
      }

      const service = await this.serviceService.restore(id);
      if (!service) {
        throw new NotFoundException('Service not found or not deleted');
      }

      return {
        message: 'Service restored successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: service.id,
          name: service.name,
          categoryId: service.categoryId.toString(),
          category: (service.categoryId as any).name,
          price: service.price,
          description: service.description,
          duration: service.duration,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid service ID format');
      }
      throw new InternalServerErrorException('Failed to restore service');
    }
  }
}
