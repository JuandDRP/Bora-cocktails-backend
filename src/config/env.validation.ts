import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  MONGODB_URI!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  PORT?: number;

  @IsIn(['development', 'test', 'production'])
  @IsOptional()
  NODE_ENV?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, {
    ...config,
    PORT: config.PORT === undefined ? undefined : Number(config.PORT),
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Variables de entorno inválidas: ${errors.map((e) => e.property).join(', ')}`);
  }

  return config;
}
