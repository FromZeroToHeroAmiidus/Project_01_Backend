import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto, UserResponseDto } from './dto';
import { UpdatePasswordDto } from './dto';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import * as argon from 'argon2';
// tle ma Nejc postimane findById pa take ...
//import { AbstractService } from 'modules/common/abstract.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {} // da injectam prismo :D

  async editUser(userId: number, dto: EditUserDto): Promise<User> {
    //  const { avatar, ...userData } = dto; // Extract avatar from DTO+++
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
        //     ...(avatar && { avatar }), // obj slika
        //    avatar: avatar || null, // remove - nazaj na null
      },
    });

    delete user.hash;

    return user;
  }

  async changePassword(userId: number, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify the current password
    const isCurrentPasswordValid = await argon.verify(
      user.hash,
      dto.currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    // Verify new password and confirm new password match
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new ForbiddenException(
        'New password and confirm new password must match',
      );
    }

    // Hash the new password
    const newHashedPassword = await argon.hash(dto.newPassword);

    // Update the user's password
    await this.prisma.user.update({
      where: { id: userId },
      data: { hash: newHashedPassword },
    });
  }

  async updateUserImageId(userId: number, avatar: string): Promise<User> {
    // const user = await this.findById(id);
    return this.editUser(userId, { avatar });
  }

  async findImageNameByUserId(
    userId: number,
    dto: EditUserDto,
  ): Promise<string> {
    // You can use `dto` here to access properties like `avatar`
    const user = await this.editUser(userId, dto);
    console.log('findImage: ' + user.avatar); // Assuming `avatar` is a property of the `user` object
    return user.avatar;
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
