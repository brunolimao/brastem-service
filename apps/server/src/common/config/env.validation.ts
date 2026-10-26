import Joi from 'joi'

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3333),
  HOST: Joi.string().default('127.0.0.1'),
  DATA_DIR: Joi.string().default('./data'),
  // Pasta do front compilado; quando informada, o servidor também entrega a interface (app desktop).
  CLIENT_DIR: Joi.string().optional(),
  // Credenciais OAuth do Google Drive (tipo "App para computador"). Também podem ser digitadas na tela.
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  JWT_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      // biome-ignore lint/suspicious/noThenProperty: opção `then` da API do Joi
      then: Joi.required(),
      otherwise: Joi.optional().default('segredo-apenas-para-dev-e-testes-0123456789'),
    }),
  JWT_ACCESS_TTL_MIN: Joi.number().integer().min(1).default(15),
  REFRESH_TTL_DAYS: Joi.number().integer().min(1).default(7),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  COOKIE_SECURE: Joi.boolean().default(false),
  SWAGGER_ENABLED: Joi.boolean().default(true),
  // Versão do app desktop (o Electron informa); fora dele, "desenvolvimento".
  APP_VERSION: Joi.string().optional(),
})
