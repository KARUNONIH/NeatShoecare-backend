import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
  HttpStatus,
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
    const result = await this.authService.loginWithGoogle(
      req.user.googleId,
      req.user.email,
      req.user.name,
    );
    const frontendRedirectUrl = process.env.FRONTEND_REDIRECT_URL!;
    res.redirect(`${frontendRedirectUrl}?token=${result.access_token}`);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  async logout() {
    const result = await this.authService.logout();
    return {
      message: result.message,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Req() req) {
    if (!req.user?.userId) {
      return {
        message: 'User ID not found in request',
        status: 'fail',
        code: HttpStatus.UNAUTHORIZED,
        data: null,
      };
    }
    const user = await this.authService.getProfile(req.user.userId);
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
  }
}
