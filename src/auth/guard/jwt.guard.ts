import { AuthGuard } from '@nestjs/passport';

// da ne bi uporabljali v user.controller.ts ->     @UseGuards(AuthGuard('jwt'))
// ampak kr ...(JwtGuard) - seveda importamo kot tak { JwtGuard }
export class JwtGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
