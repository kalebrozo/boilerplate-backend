import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        role: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string | null;
        updatedAt: Date;
        email: string;
        password: string;
        roleId: string;
    }>;
    findAll(pagination: PaginationDto): Promise<{
        data: ({
            role: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            name: string | null;
            updatedAt: Date;
            email: string;
            password: string;
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
                action: string;
                subject: string;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string | null;
        updatedAt: Date;
        email: string;
        password: string;
        roleId: string;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        role: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string | null;
        updatedAt: Date;
        email: string;
        password: string;
        roleId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string | null;
        updatedAt: Date;
        email: string;
        password: string;
        roleId: string;
    }>;
}
