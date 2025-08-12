import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Gera um ID único para a requisição
    const requestId = uuidv4();
    
    // Adiciona o ID à requisição
    (req as any).id = requestId;
    
    // Adiciona o ID ao header de resposta para rastreamento
    res.setHeader('X-Request-ID', requestId);
    
    next();
  }
}