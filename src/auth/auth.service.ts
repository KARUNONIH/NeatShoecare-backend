import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './user.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async loginWithGoogle(googleId: string, email: string, name: string): Promise<{ access_token: string; profile: any }> {
    let user = await this.userModel.findOne({ googleId });
    if (!user) {
      user = await this.userModel.create({ 
        googleId, 
        email, 
        name, 
        phone: null,
        address: null,
        branchId: null,
        role: UserRole.UNASSIGNED 
      });
    }
    
    const payload = { 
      sub: user.id,
      email: user.email, 
      role: user.role 
    };
    
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      branchId: user.branchId
    };

    return {
      access_token: this.jwtService.sign(payload),
      profile: profile
    };
  }

  async logout(): Promise<{ message: string }> {
    return { message: 'Logout success' };
  }

  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).select('-googleId');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}