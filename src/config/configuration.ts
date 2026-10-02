import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongodbUri: process.env.MONGODB_URI ?? '',
  swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
}));
