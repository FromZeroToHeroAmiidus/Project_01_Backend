import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
//import { Request } from 'express';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { EditUserDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('me') //:PORST/me --- user info in finally ver.
  getMe(
    @GetUser() user: User,
    @GetUser('email') email: string, // kak pridobim specificno stvar
  ) {
    console.log({ email });
    return user;
  }

  @Patch()
  editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
    return this.userService.editUser(userId, dto);
  }
}
