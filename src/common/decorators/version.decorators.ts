import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiVersion } from './api-version.decorator';

// Decorator para marcar endpoints como deprecated
export const DEPRECATED_VERSION_KEY = 'deprecatedVersion';
export const DeprecatedVersion = (version: string, deprecatedSince?: string) =>
  SetMetadata(DEPRECATED_VERSION_KEY, { version, deprecatedSince });

// Decorator para marcar versão mínima requerida
export const MIN_VERSION_KEY = 'minVersion';
export const MinVersion = (version: string) => SetMetadata(MIN_VERSION_KEY, version);

// Decorator para marcar versão máxima suportada
export const MAX_VERSION_KEY = 'maxVersion';
export const MaxVersion = (version: string) => SetMetadata(MAX_VERSION_KEY, version);

// Decorator combinado para configuração completa de versão
export function ApiVersioned(options: {
  version: string;
  deprecated?: boolean;
  deprecatedSince?: string;
  minVersion?: string;
  maxVersion?: string;
  summary?: string;
  description?: string;
}) {
  const decorators = [
    ApiVersion(options.version),
    ApiHeader({
      name: 'Accept-Version',
      description: 'API Version',
      required: false,
      schema: {
        type: 'string',
        enum: ['1', '2'],
        default: '1',
      },
    }),
  ];

  if (options.deprecated) {
    decorators.push(
      DeprecatedVersion(options.version, options.deprecatedSince),
      ApiResponse({
        status: 410,
        description: `API version ${options.version} is deprecated${options.deprecatedSince ? ` since ${options.deprecatedSince}` : ''}`,
      }),
    );
  }

  if (options.minVersion) {
    decorators.push(MinVersion(options.minVersion));
  }

  if (options.maxVersion) {
    decorators.push(MaxVersion(options.maxVersion));
  }

  if (options.summary || options.description) {
    decorators.push(
      ApiResponse({
        status: 200,
        description: options.description || options.summary,
      }),
    );
  }

  return applyDecorators(...decorators);
}

// Decorator para endpoints que suportam múltiplas versões
export function ApiMultiVersion(versions: string[]) {
  return applyDecorators(
    SetMetadata('supportedVersions', versions),
    ApiHeader({
      name: 'Accept-Version',
      description: 'API Version',
      required: false,
      schema: {
        type: 'string',
        enum: versions,
        default: versions[0],
      },
    }),
  );
}

// Decorator para marcar endpoints como experimentais
export const EXPERIMENTAL_KEY = 'experimental';
export const Experimental = (version: string) =>
  applyDecorators(
    SetMetadata(EXPERIMENTAL_KEY, version),
    ApiResponse({
      status: 200,
      description: 'This endpoint is experimental and may change without notice',
      headers: {
        'X-Experimental': {
          description: 'Indicates this is an experimental endpoint',
          schema: { type: 'string' },
        },
      },
    }),
  );