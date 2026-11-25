import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { Public } from './public.decorator.js';
import { UsuarioAtual } from './usuario-atual.decorator.js';
import type { UsuarioAutenticado } from './usuario-autenticado.js';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Quem sou eu? (usado pelo frontend para saber o papel e montar o menu)
  @Get('me')
  me(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return usuario;
  }
}
