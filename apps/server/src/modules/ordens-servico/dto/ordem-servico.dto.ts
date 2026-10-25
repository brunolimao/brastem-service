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
  Matches,
  Min,
  ValidateNested,
} from 'class-validator'
import { DATA_ISO_REGEX } from '../../../common/utils/dates.js'
import { PaginacaoQueryDto } from '../../../common/utils/pagination.js'
import { OptionalText } from '../../../common/validation/decorators.js'
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
  @IsOptional()
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
  garantiaDias?: number

  @ApiPropertyOptional({ description: 'Atendimento em garantia (não entra no valor faturado)' })
  @IsOptional()
  @IsBoolean()
  isGarantia?: boolean

  @ApiProperty({ example: '2026-10-25' })
  @IsString()
  @Matches(DATA_ISO_REGEX)
  abertura!: string

  @ApiPropertyOptional({ description: 'Obrigatória quando o status é FECHADO' })
  @IsOptional()
  @IsString()
  @Matches(DATA_ISO_REGEX)
  fechamento?: string

  @ApiPropertyOptional({ type: [PagamentoInputDto] })
  @IsOptional()
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
export class UpdateOrdemServicoDto extends PartialType(OrdemServicoBaseDto) {}

export const CAMPOS_BUSCA_OS = ['id', 'abertura', 'valor', 'status', 'solucionado'] as const

export class OrdensServicoQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({ enum: CAMPOS_BUSCA_OS, description: 'Sem campo, lista tudo' })
  @IsOptional()
  @IsIn(CAMPOS_BUSCA_OS)
  campo?: (typeof CAMPOS_BUSCA_OS)[number]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  busca?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clienteId?: number

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  aparelhoId?: number
}
