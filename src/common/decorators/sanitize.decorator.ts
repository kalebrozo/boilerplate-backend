import { Transform } from 'class-transformer';

/**
 * Função auxiliar para sanitizar strings
 */
function sanitizeString(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Decorator para sanitização automática de dados de entrada
 * Remove tags HTML, scripts e outros conteúdos potencialmente perigosos
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeString(value);
    }
    return value;
  });
}

/**
 * Decorator para sanitização de arrays de strings
 */
export function SanitizeArray() {
  return Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    }
    return value;
  });
}

/**
 * Decorator para sanitização de objetos aninhados
 */
export function SanitizeNested() {
  return Transform(({ value }) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sanitized = { ...value };
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = sanitizeString(sanitized[key]);
        }
      });
      return sanitized;
    }
    return value;
  });
}