import { applyDecorators } from '@nestjs/common'
import { IsISO8601, IsString, Matches, MaxLength, ValidateIf } from 'class-validator'
import { DATA_ISO_REGEX } from '../utils/dates.js'

/**
 * Campo que pode faltar, mas, se vier, é validado, inclusive `null`.
 * O `@IsOptional()` do class-validator deixa `null` passar, e as colunas são NOT NULL: o erro
 * chegava no banco e virava 500 em vez de 400. Use `@IsOptional()` só onde `null` é um valor válido.
 */
export const Opcional = () => ValidateIf((_objeto, valor) => valor !== undefined)

/** Texto opcional (aceita string vazia, como os formulários enviam; `null` não). */
export const OptionalText = (max = 255) => applyDecorators(Opcional(), IsString(), MaxLength(max))

/** Data `yyyy-MM-dd` que existe no calendário (recusa 2026-02-30). */
export const DataIso = () =>
  applyDecorators(IsString(), Matches(DATA_ISO_REGEX), IsISO8601({ strict: true }))
