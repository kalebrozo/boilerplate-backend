import { envValidationSchema } from './env.validation';

describe('Environment Validation', () => {
  it('should validate required environment variables', () => {
    const validEnv = {
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes',
      JWT_EXPIRES_IN: '1d',
    };

    const { error } = envValidationSchema.validate(validEnv);
    expect(error).toBeUndefined();
  });

  it('should reject invalid NODE_ENV', () => {
    const invalidEnv = {
      NODE_ENV: 'invalid',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes',
    };

    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('must be one of');
  });

  it('should reject short JWT_SECRET', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
      JWT_SECRET: 'short',
    };

    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('at least 32 characters');
  });

  it('should require DATABASE_URL', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes',
    };

    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('required');
  });

  it('should apply default values', () => {
    const minimalEnv = {
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes',
    };

    const { error, value } = envValidationSchema.validate(minimalEnv);
    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.PORT).toBe(3003);
    expect(value.JWT_EXPIRES_IN).toBe('1d');
    expect(value.REDIS_HOST).toBe('localhost');
    expect(value.REDIS_PORT).toBe(6379);
  });

  it('should validate numeric values', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      PORT: 'not-a-number',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes',
    };

    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('must be a number');
  });
});