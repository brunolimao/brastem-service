import { applyDecorators } from '@nestjs/common'
import { IsOptional, IsString, MaxLength } from 'class-validator'

/** Texto opcional (aceita string vazia, como os formulários enviam). */
export const OptionalText = (max = 255) => applyDecorators(IsOptional(), IsString(), MaxLength(max))
