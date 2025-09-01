import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.schema';

export class ProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  address: string;
  @ApiProperty()
  branchId: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}