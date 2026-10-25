import { TIPOS_PAGAMENTO, type TipoPagamento } from '@brastem/shared'
import { ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator'
import { DATA_ISO_REGEX } from '../../../common/utils/dates.js'
import { PaginacaoQueryDto, PeriodoQueryDto } from '../../../common/utils/pagination.js'
import { OptionalText } from '../../../common/validation/decorators.js'

export class PagamentoInputDto {
  @ApiProperty({ description: 'Valor em centavos', example: 15000 })
  @IsInt()
  @Min(0)
  valor!: number

  @ApiProperty({ enum: TIPOS_PAGAMENTO })
  @IsIn(TIPOS_PAGAMENTO)
  tipo!: TipoPagamento

  @ApiPropertyOptional({ description: 'Número de parcelas mensais; 0 = à vista', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(12)
  parcelas?: number

  @ApiProperty({ description: 'Data do pagamento ou da primeira cobrança (yyyy-MM-dd)' })
  @IsString()
  @Matches(DATA_ISO_REGEX)
  data!: string

  @ApiPropertyOptional()
  @OptionalText()
  observacao?: string
}

export const CAMPOS_BUSCA_PAGAMENTO = ['id', 'valor', 'tipo', 'observacao'] as const

export class PagamentosQueryDto extends IntersectionType(PaginacaoQueryDto, PeriodoQueryDto) {
  @ApiPropertyOptional({ enum: CAMPOS_BUSCA_PAGAMENTO })
  @IsOptional()
  @IsIn(CAMPOS_BUSCA_PAGAMENTO)
  campo?: (typeof CAMPOS_BUSCA_PAGAMENTO)[number]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  busca?: string

  @ApiPropertyOptional({ enum: TIPOS_PAGAMENTO })
  @IsOptional()
  @IsIn(TIPOS_PAGAMENTO)
  tipo?: TipoPagamento
}
