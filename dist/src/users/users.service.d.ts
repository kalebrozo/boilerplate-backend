import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        role: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        email: string;
        name: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    findAll(pagination: PaginationDto): Promise<{
        data: ({
            role: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            email: string;
            name: string | null;
            password: string;
            createdAt: Date;
            updatedAt: Date;
            roleId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    findOne(id: string): Promise<{
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
    } & {
        id: string;
        email: string;
        name: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        role: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        email: string;
        name: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        password: string;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
}
