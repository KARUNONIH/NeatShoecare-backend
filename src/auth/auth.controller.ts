import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import type { Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth Login' })
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth Callback' })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      if (!req.user) {
        throw new BadRequestException('Google authentication failed');
      }

      const result = await this.authService.loginWithGoogle(
        req.user.googleId,
        req.user.email,
        req.user.name,
      );

      const frontendRedirectUrl = process.env.FRONTEND_REDIRECT_URL;
      if (!frontendRedirectUrl) {
        throw new InternalServerErrorException(
          'Frontend redirect URL not configured',
        );
      }

      res.redirect(`${frontendRedirectUrl}?token=${result.access_token}`);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to process Google authentication',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Req() req) {
    try {
      if (!req.headers.authorization) {
        throw new BadRequestException('Authorization header is required');
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Valid JWT token is required');
      }

      if (!req.user?.userId) {
        throw new BadRequestException('User ID not found in request');
      }

      const result = await this.authService.logout(req.user.userId, token);
      return {
        message: result.message,
        status: 'success',
        code: HttpStatus.OK,
        data: null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to logout user');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Req() req) {
    try {
      if (!req.user?.userId) {
        return {
          message: 'User ID not found in request',
          status: 'fail',
          code: HttpStatus.UNAUTHORIZED,
          data: null,
        };
      }

      const user = await this.authService.getProfile(req.user.userId);
      if (!user) {
        return {
          message: 'User not found',
          status: 'fail',
          code: HttpStatus.NOT_FOUND,
          data: null,
        };
      }

      return {
        message: 'Profile fetched successfully',
        status: 'success',
        code: HttpStatus.OK,
        data: {
          id: user.id,
          branchId: user.branchId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user profile');
    }
  }
}
