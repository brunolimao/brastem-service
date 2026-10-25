import { BadRequestException } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator'
import { type SQL, sql } from 'drizzle-orm'
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core'
import { DATA_ISO_REGEX, hoje } from './dates.js'

export class PaginacaoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20
}

export class PeriodoQueryDto {
  @IsOptional()
  @IsString()
  @Matches(DATA_ISO_REGEX)
  inicio?: string

  @IsOptional()
  @IsString()
  @Matches(DATA_ISO_REGEX)
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
