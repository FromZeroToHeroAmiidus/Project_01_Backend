import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { EditUserDto, UserResponseDto } from './dto';
import { UpdatePasswordDto } from './dto';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  isFileExtensionSafe,
  removeFile,
  saveImageToStorage,
} from '../helpers/imageStorage';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
//import { HasPermission } from 'decorators/has-permission.decorator'

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@GetUser() user: User, @GetUser('email') email: string) {
    console.log({ email });
    console.log();
    return user;
  }

  @Patch('update-profile')
  editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
    return this.userService.editUser(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('change-password')
  async changePassword(
    @GetUser('id') userId: number,
    @Body() dto: UpdatePasswordDto,
  ) {
    //const userId = req.user.id;
    await this.userService.changePassword(userId, dto);
    return { message: 'Password updated successfully' };
  }

  @Patch('change-profile-picture')
  @UseInterceptors(FileInterceptor('avatar', saveImageToStorage))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ): Promise<User> {
    const filename = file?.filename;
    if (!filename)
      throw new BadRequestException('File must be a png, jpg/jpeg');

    const imagesFolderPath = join(process.cwd(), 'files');
    const fullImagePath = join(imagesFolderPath, file.filename);
    const fullImagePathOfPreviousImage = join(imagesFolderPath, user.avatar); // to delete the previous avatar

    if (await isFileExtensionSafe(fullImagePath)) {
      console.log(fullImagePath);
      removeFile(fullImagePathOfPreviousImage); // remove the previous avatar
      return this.userService.updateUserImageId(user.id, filename);
    }
    throw new BadRequestException('File content does not match extension!');
  }

  @Get('get/image')
  @HttpCode(HttpStatus.OK)
  //@HasPermission('users')
  async findImage(
    @GetUser('avatar') avatar: string,
    @Response() res,
  ): Promise<void> {
    const imageName = avatar;
    console.log('Fukec : ' + imageName);

    return res.sendFile(imageName, {
      root: './files',
    });
  }

  @Get('get/removeimage')
  @HttpCode(HttpStatus.OK)
  //@HasPermission('users')
  async removeImage(
    @GetUser('avatar') avatar: string,
    @GetUser('id') id: number,
    @Response() res,
  ): Promise<void> {
    try {
      const imagePath = join('./files', avatar);

      // Check if the file exists before attempting to remove it
      if (existsSync(imagePath)) {
        // Remove the file from the file system
        unlinkSync(imagePath);
        res.status(HttpStatus.OK).send('Avatar removed successfully');
        await this.userService.editUser(id, { avatar: null }); // da vidmo, ce butnemo nazaj na null pri useru ...
      } else {
        res.status(HttpStatus.NOT_FOUND).send('Avatar not found');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Failed to remove avatar');
    }
  }

  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.userService.getUserById(id);
  }
}
