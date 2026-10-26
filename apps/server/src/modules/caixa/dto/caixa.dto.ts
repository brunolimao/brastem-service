import { IntersectionType } from '@nestjs/swagger'
import { PaginacaoQueryDto, PeriodoQueryDto } from '../../../common/utils/pagination.js'

/** Período do caixa e a página da lista (o total e as formas valem sempre para o período inteiro). */
export class CaixaQueryDto extends IntersectionType(PaginacaoQueryDto, PeriodoQueryDto) {}
