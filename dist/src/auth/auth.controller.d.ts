import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any): Promise<AuthResponseDto>;
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    me(user: any): Promise<any>;
}
