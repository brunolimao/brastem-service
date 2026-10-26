import { BadRequestException } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'
import { type SQL, sql } from 'drizzle-orm'
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import { DataIso, Opcional } from '../validation/decorators.js'
import { hoje } from './dates.js'

export class PaginacaoQueryDto {
  @Opcional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @Opcional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20
}

export class PeriodoQueryDto {
  @Opcional()
  @DataIso()
  inicio?: string

  @Opcional()
  @DataIso()
  fim?: string
}

export interface Pagina<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export const limites = ({ page, pageSize }: PaginacaoQueryDto) => ({
  limit: pageSize,
  offset: (page - 1) * pageSize,
})

/** Período inclusivo nas duas pontas; sem datas, usa o dia de hoje. */
export function resolverPeriodo({ inicio, fim }: PeriodoQueryDto) {
  const padrao = hoje()
  const periodo = { inicio: inicio ?? fim ?? padrao, fim: fim ?? inicio ?? padrao }
  if (periodo.inicio > periodo.fim) {
    throw new BadRequestException('A data inicial não pode ser depois da data final')
  }
  return periodo
}

const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, '\\$&')

export const contem = (coluna: SQLiteColumn | SQL, busca: string): SQL =>
  sql`${coluna} like ${`%${escaparLike(busca)}%`} escape '\\'`
