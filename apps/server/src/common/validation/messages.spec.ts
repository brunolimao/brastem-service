import 'reflect-metadata'
import { BadRequestException } from '@nestjs/common'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsEmail,
  IsInt,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { describe, expect, it } from 'vitest'
import { createValidationPipe } from './messages.js'

class Telefone {
  @Matches(/^\d+$/)
  numero!: string
}

class Exemplo {
  @IsString() @MinLength(3) nome!: string
  @MaxLength(5) apelido!: string
  @IsEmail() email!: string
  @IsBoolean() ativo!: boolean
  @IsInt() @Min(1) @Max(10) nota!: number
  @IsPositive() valor!: number
  @ArrayMinSize(1) @ArrayMaxSize(2) tags!: string[]
  @ValidateNested({ each: true }) @Type(() => Telefone) telefones!: Telefone[]
}

const VALIDO = {
  nome: 'Maria',
  apelido: 'Mari',
  email: 'maria@exemplo.com',
  ativo: true,
  nota: 5,
  valor: 10,
  tags: ['a'],
  telefones: [{ numero: '11999990000' }],
}

/** Mensagens que o servidor devolveria para este corpo. */
async function mensagens(corpo: Record<string, unknown>): Promise<{ message: string[] }> {
  try {
    await createValidationPipe().transform(corpo, { type: 'body', metatype: Exemplo })
    return { message: [] }
  } catch (erro) {
    expect(erro).toBeInstanceOf(BadRequestException)
    return (erro as BadRequestException).getResponse() as { message: string[] }
  }
}

describe('mensagens de validação em português', () => {
  it('corpo válido passa', async () => {
    expect((await mensagens(VALIDO)).message).toEqual([])
  })

  it.each([
    [{ nome: 'Al' }, 'O campo "nome" deve ter no mínimo 3 caracteres'],
    [{ apelido: 'Marinalva' }, 'O campo "apelido" deve ter no máximo 5 caracteres'],
    [{ email: 'maria' }, 'O campo "email" deve ser um e-mail válido'],
    [{ nota: 0 }, 'O campo "nota" deve ser no mínimo 1'],
    [{ nota: 11 }, 'O campo "nota" deve ser no máximo 10'],
    [{ nota: 2.5 }, 'O campo "nota" deve ser um número inteiro'],
    [{ valor: -3 }, 'O campo "valor" deve ser um número positivo'],
    [{ tags: [] }, 'O campo "tags" deve ter no mínimo 1 item(ns)'],
    [{ tags: ['a', 'b', 'c'] }, 'O campo "tags" deve ter no máximo 2 item(ns)'],
    [
      { telefones: [{ numero: '11-9999' }] },
      'O campo "telefones.0.numero" está em um formato inválido',
    ],
    [{ intruso: 1 }, 'O campo "intruso" não é permitido'],
  ])('%o → %s', async (alteracao, esperada) => {
    expect((await mensagens({ ...VALIDO, ...alteracao })).message).toEqual([esperada])
  })

  it('campo obrigatório ausente diz qual é', async () => {
    const { nome: _, ...semNome } = VALIDO
    expect((await mensagens(semNome)).message).toContain('O campo "nome" deve ser um texto')
  })
})
