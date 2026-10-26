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

/** Texto de busca que é só um número digitado com ou sem pontuação: "31999991111", "(31) 9999", "123.456". */
const PARECE_NUMERO = /^[\d\s().\-/]+$/

/** Os dígitos do texto, se ele parecer um número (CPF, telefone, CEP); senão `null`. */
export function digitosDaBusca(busca: string): string | null {
  if (!PARECE_NUMERO.test(busca)) return null
  const digitos = busca.replace(/\D/g, '')
  return digitos === '' ? null : digitos
}

/**
 * Busca em campos gravados com máscara (telefone, CPF/CNPJ, CEP): acha pelo texto como está gravado e também
 * só pelos dígitos, ignorando parênteses, espaços, hífen, ponto e barra dos dois lados. Assim "31999991111"
 * encontra "(31) 99999-1111" e "12345678901" encontra "123.456.789-01".
 */
export function contemNumero(coluna: SQLiteColumn | SQL, busca: string): SQL {
  const digitos = digitosDaBusca(busca)
  if (digitos === null) return contem(coluna, busca)
  const soDigitos = sql`replace(replace(replace(replace(replace(replace(${coluna}, '(', ''), ')', ''), ' ', ''), '-', ''), '.', ''), '/', '')`
  return sql`(${contem(coluna, busca)} or ${soDigitos} like ${`%${digitos}%`})`
}
