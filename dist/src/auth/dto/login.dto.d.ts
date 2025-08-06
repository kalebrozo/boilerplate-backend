export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    email: string;
    name: string;
    password: string;
    roleId: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: {
            id: string;
            name: string;
        };
    };
}
