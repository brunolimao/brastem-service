import { TIPOS_TRANSACAO, type TipoTransacao } from '@brastem/shared'
import { ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import { DATA_ISO_REGEX } from '../../../common/utils/dates.js'
import { PaginacaoQueryDto, PeriodoQueryDto } from '../../../common/utils/pagination.js'
import { OptionalText } from '../../../common/validation/decorators.js'
import { PagamentoInputDto } from '../../pagamentos/dto/pagamento.dto.js'

export class CreateTransacaoDto {
  @ApiProperty({ enum: TIPOS_TRANSACAO })
  @IsIn(TIPOS_TRANSACAO)
  tipo!: TipoTransacao

  @ApiProperty({
    description:
      'Receita: venda, gorjeta, outros. Despesa: transporte, peca, loja, materiais, outros',
  })
  @IsString()
  @IsNotEmpty()
  categoria!: string

  @ApiProperty({ example: '2026-10-25' })
  @IsString()
  @Matches(DATA_ISO_REGEX)
  data!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  descricao!: string

  @ApiPropertyOptional()
  @OptionalText(1000)
  observacao?: string

  @ApiProperty({
    description: 'Valor em centavos, sempre positivo (despesas são negativadas no caixa)',
  })
  @IsInt()
  @Min(1)
  valor!: number

  @ApiPropertyOptional({
    type: [PagamentoInputDto],
    description: 'Sem pagamentos, registra um pagamento à vista em dinheiro na data informada',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PagamentoInputDto)
  pagamentos?: PagamentoInputDto[]
}

export class TransacoesQueryDto extends IntersectionType(PaginacaoQueryDto, PeriodoQueryDto) {
  @ApiPropertyOptional({ enum: TIPOS_TRANSACAO })
  @IsOptional()
  @IsIn(TIPOS_TRANSACAO)
  tipo?: TipoTransacao
}
