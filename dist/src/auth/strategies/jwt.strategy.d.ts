import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: {
            permissions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                action: string;
                subject: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
export {};
