import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class VersionMiddleware implements NestMiddleware {
  private readonly supportedVersions = ['1', '2'];
  private readonly defaultVersion = '1';

  use(req: Request, res: Response, next: NextFunction) {
    // Extrair versão da URL (formato: /v1/users, /v2/users)
    const urlVersion = this.extractVersionFromUrl(req.url);
    
    // Extrair versão do header (formato: Accept-Version: 1)
    const headerVersion = req.headers['accept-version'] as string;
    
    // Extrair versão do query parameter (formato: ?version=1)
    const queryVersion = req.query.version as string;

    // Prioridade: URL > Header > Query > Default
    const version = urlVersion || headerVersion || queryVersion || this.defaultVersion;

    // Validar se a versão é suportada
    if (!this.supportedVersions.includes(version)) {
      throw new BadRequestException(
        `API version '${version}' is not supported. Supported versions: ${this.supportedVersions.join(', ')}`,
      );
    }

    // Adicionar versão ao objeto request para uso posterior
    (req as any).version = version;
    
    // Adicionar header de resposta com a versão utilizada
    res.setHeader('X-API-Version', version);
    
    // Adicionar headers de versionamento
    res.setHeader('X-Supported-Versions', this.supportedVersions.join(', '));
    res.setHeader('X-Default-Version', this.defaultVersion);
    
    next();
  }

  private extractVersionFromUrl(url: string): string | null {
    // Regex para capturar versão no formato /v1/, /v2/, etc.
    const versionMatch = url.match(/^\/v(\d+)\//); 
    return versionMatch ? versionMatch[1] : null;
  }
}