import {
  type ArgumentsHost,
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import { describe, expect, it, vi } from 'vitest'
import { AllExceptionsFilter } from './all-exceptions.filter.js'

/** Resposta que o filtro mandaria para o navegador. */
function responder(erro: unknown) {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/api/teste' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost
  new AllExceptionsFilter().catch(erro, host)
  const corpo = json.mock.calls[0]?.[0] as { statusCode: number; message: unknown; path: string }
  expect(status).toHaveBeenCalledWith(corpo.statusCode)
  return corpo
}

describe('AllExceptionsFilter', () => {
  it('mantém a mensagem escrita pelo sistema', () => {
    expect(responder(new ConflictException('Já existe um usuário com esse nome'))).toMatchObject({
      statusCode: 409,
      message: 'Já existe um usuário com esse nome',
      path: '/api/teste',
    })
  })

  it('troca as mensagens em inglês do framework pelas em português', () => {
    expect(responder(new NotFoundException())).toMatchObject({
      statusCode: 404,
      message: 'Recurso não encontrado',
    })
    expect(responder(new ForbiddenException())).toMatchObject({
      statusCode: 403,
      message: 'Você não tem permissão para esta ação',
    })
    expect(responder(new NotFoundException('Cannot GET /api/nada'))).toMatchObject({
      message: 'Recurso não encontrado',
    })
  })

  it('limite de tentativas vira 429 com aviso em português (R-ACE-03)', () => {
    expect(responder(new ThrottlerException())).toMatchObject({
      statusCode: 429,
      message: 'Muitas tentativas. Tente novamente em instantes',
    })
  })

  it('erro do Express com status 4xx (ex.: arquivo grande) mantém o status', () => {
    expect(responder(Object.assign(new Error('too large'), { status: 413 }))).toMatchObject({
      statusCode: 413,
      message: 'Arquivo grande demais',
    })
  })

  it('erro inesperado vira 500 sem expor detalhes, e vai para o registro', () => {
    const registrar = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    const erro = new Error('SQLITE_CORRUPT: database disk image is malformed')
    expect(responder(erro)).toMatchObject({
      statusCode: 500,
      message: 'Erro interno do servidor',
    })
    expect(registrar).toHaveBeenCalledWith(erro)
    // Um "status" 5xx vindo de fora não é confiável: continua 500.
    expect(responder(Object.assign(new Error('x'), { status: 503 })).statusCode).toBe(500)
  })
})
