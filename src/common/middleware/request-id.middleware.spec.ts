import { RequestIdMiddleware } from './request-id.middleware';
import { Request, Response, NextFunction } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
    
    mockRequest = {};
    
    mockResponse = {
      setHeader: jest.fn(),
    };
    
    mockNext = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should add request ID to request object', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect((mockRequest as any).id).toBeDefined();
      expect(typeof (mockRequest as any).id).toBe('string');
      expect((mockRequest as any).id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should set X-Request-ID header in response', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        (mockRequest as any).id,
      );
    });

    it('should call next function', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate unique IDs for different requests', () => {
      const mockRequest1 = {};
      const mockRequest2 = {};
      const mockResponse1: Partial<Response> = { setHeader: jest.fn() };
      const mockResponse2: Partial<Response> = { setHeader: jest.fn() };

      middleware.use(
        mockRequest1 as Request,
        mockResponse1 as Response,
        mockNext,
      );
      
      middleware.use(
        mockRequest2 as Request,
        mockResponse2 as Response,
        mockNext,
      );

      expect((mockRequest1 as any).id).toBeDefined();
      expect((mockRequest2 as any).id).toBeDefined();
      expect((mockRequest1 as any).id).not.toBe((mockRequest2 as any).id);
    });
  });
});