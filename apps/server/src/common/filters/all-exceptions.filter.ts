import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import type { Request, Response } from 'express'

const defaultMessages: Record<number, string> = {
  400: 'Requisição inválida',
  401: 'Você precisa estar autenticado',
  403: 'Você não tem permissão para esta ação',
  404: 'Recurso não encontrado',
  409: 'Conflito com um registro existente',
  413: 'Arquivo grande demais',
  429: 'Muitas tentativas. Tente novamente em instantes',
  500: 'Erro interno do servidor',
}

/** Erros do Express/body-parser (ex.: 413 arquivo grande, 404 do sendFile) trazem o status no próprio objeto. */
const statusDeErroHttp = (erro: unknown) => {
  const status = (erro as { status?: unknown } | null)?.status
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined
}

const frameworkDefaults = new Set(['Unauthorized', 'Forbidden', 'Not Found', 'Bad Request'])

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    const status =
      exception instanceof ThrottlerException
        ? HttpStatus.TOO_MANY_REQUESTS
        : exception instanceof HttpException
          ? exception.getStatus()
          : (statusDeErroHttp(exception) ?? HttpStatus.INTERNAL_SERVER_ERROR)

    let message: string | string[] = defaultMessages[status] ?? 'Erro inesperado'

    if (exception instanceof HttpException && !(exception instanceof ThrottlerException)) {
      const body = exception.getResponse()
      const raw =
        typeof body === 'string' ? body : (body as { message?: string | string[] }).message
      const isDefault =
        typeof raw === 'string' && (frameworkDefaults.has(raw) || raw.startsWith('Cannot '))
      if (raw && !isDefault) message = raw
    }

    if (status >= 500) this.logger.error(exception)

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    })
  }
}
