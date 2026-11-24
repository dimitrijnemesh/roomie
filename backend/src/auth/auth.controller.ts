import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { ApiErrorDto, AuthResultDto, SentDto, UserDto } from './dto/responses.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Реєстрація', description: 'Створює користувача і надсилає 6-значний код на пошту.' })
  @ApiResponse({ status: 201, type: SentDto })
  @ApiResponse({ status: 400, type: ApiErrorDto, description: 'EMAIL_NOT_STUDENT · WEAK_PASSWORD · INVALID_NAME' })
  @ApiResponse({ status: 409, type: ApiErrorDto, description: 'EMAIL_TAKEN' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Підтвердження пошти', description: 'Перевіряє код і повертає JWT.' })
  @ApiResponse({ status: 200, type: AuthResultDto })
  @ApiResponse({ status: 400, type: ApiErrorDto, description: 'CODE_INVALID · CODE_EXPIRED' })
  @ApiResponse({ status: 429, type: ApiErrorDto, description: 'TOO_MANY_ATTEMPTS' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Public()
  @Post('resend-code')
  @HttpCode(200)
  @ApiOperation({ summary: 'Надіслати код ще раз', description: 'Не частіше ніж раз на 60 секунд.' })
  @ApiResponse({ status: 200, type: SentDto })
  @ApiResponse({ status: 400, type: ApiErrorDto, description: 'ALREADY_VERIFIED' })
  @ApiResponse({ status: 404, type: ApiErrorDto, description: 'USER_NOT_FOUND' })
  @ApiResponse({ status: 429, type: ApiErrorDto, description: 'RESEND_TOO_SOON' })
  resendCode(@Body() dto: ResendCodeDto) {
    return this.auth.resendCode(dto.email);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вхід' })
  @ApiResponse({ status: 200, type: AuthResultDto })
  @ApiResponse({ status: 401, type: ApiErrorDto, description: 'INVALID_CREDENTIALS' })
  @ApiResponse({ status: 403, type: ApiErrorDto, description: 'EMAIL_NOT_VERIFIED — фронт веде на /verify' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Поточний користувач' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 401, type: ApiErrorDto, description: 'UNAUTHORIZED · TOKEN_INVALID' })
  me(@CurrentUser() user: User) {
    return this.auth.toUserDto(user);
  }
}
