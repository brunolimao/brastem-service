import { STATUS_OS, type StatusOS } from '@brastem/shared'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { PaginacaoQueryDto } from '../../../common/utils/pagination.js'
import { DataIso, Opcional, OptionalText } from '../../../common/validation/decorators.js'
import { PagamentoInputDto } from '../../pagamentos/dto/pagamento.dto.js'

class OrdemServicoBaseDto {
  @ApiProperty({ enum: STATUS_OS })
  @IsIn(STATUS_OS)
  status!: StatusOS

  @ApiProperty({ description: 'Valor em centavos' })
  @IsInt()
  @Min(0)
  valor!: number

  @ApiPropertyOptional({ description: 'Taxa de deslocamento em centavos' })
  @Opcional()
  @IsInt()
  @Min(0)
  taxaDeslocamento?: number

  @ApiPropertyOptional() @OptionalText(2000) relatado?: string
  @ApiPropertyOptional() @OptionalText(2000) identificado?: string
  @ApiPropertyOptional() @OptionalText(2000) solucionado?: string
  @ApiPropertyOptional() @OptionalText(2000) observacao?: string

  @ApiPropertyOptional({
    description: 'Dias de garantia do serviço; estende a garantia do aparelho',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  garantiaDias?: number | null

  @ApiPropertyOptional({ description: 'Atendimento em garantia (não entra no valor faturado)' })
  @Opcional()
  @IsBoolean()
  isGarantia?: boolean

  @ApiProperty({ example: '2026-10-25' })
  @DataIso()
  abertura!: string

  @ApiPropertyOptional({ description: 'Obrigatória quando o status é FECHADO; null limpa' })
  @IsOptional()
  @DataIso()
  fechamento?: string | null

  @ApiPropertyOptional({ type: [PagamentoInputDto] })
  @Opcional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PagamentoInputDto)
  pagamentos?: PagamentoInputDto[]
}

export class CreateOrdemServicoDto extends OrdemServicoBaseDto {
  @ApiProperty()
  @IsInt()
  clienteId!: number

  @ApiProperty()
  @IsInt()
  aparelhoId!: number
}

/** Se `pagamentos` for enviado, substitui todos os pagamentos e parcelas da OS. */
// skipNullProperties: false = `null` também é validado (o PartialType normal o deixa passar e o banco
// devolvia 500 em colunas NOT NULL). Campos que aceitam null de propósito usam @IsOptional() na base.
export class UpdateOrdemServicoDto extends PartialType(OrdemServicoBaseDto, {
  skipNullProperties: false,
}) {}

export const CAMPOS_BUSCA_OS = ['id', 'abertura', 'valor', 'status', 'solucionado'] as const

export class OrdensServicoQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({ enum: CAMPOS_BUSCA_OS, description: 'Sem campo, lista tudo' })
  @Opcional()
  @IsIn(CAMPOS_BUSCA_OS)
  campo?: (typeof CAMPOS_BUSCA_OS)[number]

  @ApiPropertyOptional()
  @Opcional()
  @IsString()
  busca?: string

  @ApiPropertyOptional()
  @Opcional()
  @Type(() => Number)
  @IsInt()
  clienteId?: number

  @ApiPropertyOptional()
  @Opcional()
  @Type(() => Number)
  @IsInt()
  aparelhoId?: number
}
