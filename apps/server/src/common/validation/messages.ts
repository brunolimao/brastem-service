import { BadRequestException, type ValidationError, ValidationPipe } from '@nestjs/common'

const number = (text: string) => text.match(/-?\d+(\.\d+)?/)?.[0] ?? ''

const translators: Record<string, (field: string, original: string) => string> = {
  isNotEmpty: (f) => `O campo "${f}" é obrigatório`,
  isDefined: (f) => `O campo "${f}" é obrigatório`,
  isString: (f) => `O campo "${f}" deve ser um texto`,
  isBoolean: (f) => `O campo "${f}" deve ser verdadeiro ou falso`,
  isInt: (f) => `O campo "${f}" deve ser um número inteiro`,
  isNumber: (f) => `O campo "${f}" deve ser um número`,
  isPositive: (f) => `O campo "${f}" deve ser um número positivo`,
  isEmail: (f) => `O campo "${f}" deve ser um e-mail válido`,
  isDateString: (f) => `O campo "${f}" deve ser uma data válida`,
  isArray: (f) => `O campo "${f}" deve ser uma lista`,
  isIn: (f) => `O campo "${f}" possui um valor inválido`,
  isEnum: (f) => `O campo "${f}" possui um valor inválido`,
  minLength: (f, o) => `O campo "${f}" deve ter no mínimo ${number(o)} caracteres`,
  maxLength: (f, o) => `O campo "${f}" deve ter no máximo ${number(o)} caracteres`,
  min: (f, o) => `O campo "${f}" deve ser no mínimo ${number(o)}`,
  max: (f, o) => `O campo "${f}" deve ser no máximo ${number(o)}`,
  arrayMinSize: (f, o) => `O campo "${f}" deve ter no mínimo ${number(o)} item(ns)`,
  arrayMaxSize: (f, o) => `O campo "${f}" deve ter no máximo ${number(o)} item(ns)`,
  whitelistValidation: (f) => `O campo "${f}" não é permitido`,
  nestedValidation: (f) => `O campo "${f}" é inválido`,
}

const flatten = (errors: ValidationError[], parent = ''): string[] =>
  errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property
    const own = Object.entries(error.constraints ?? {}).map(([name, original]) =>
      (translators[name] ?? ((f: string) => `O campo "${f}" é inválido`))(field, original),
    )
    return [...own, ...flatten(error.children ?? [], field)]
  })

export const createValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => new BadRequestException(flatten(errors)),
  })
