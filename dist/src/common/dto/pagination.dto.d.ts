export declare class PaginationDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    get skip(): number;
    get take(): number;
    get orderBy(): any;
}
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
