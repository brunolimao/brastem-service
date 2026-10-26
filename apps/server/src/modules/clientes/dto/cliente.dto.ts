import { RECOMENDACOES, type Recomendacao } from '@brastem/shared'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { PaginacaoQueryDto } from '../../../common/utils/pagination.js'
import { DataIso, Opcional, OptionalText } from '../../../common/validation/decorators.js'

export class TelefoneDto {
  @ApiPropertyOptional({ description: 'Presente ao editar um telefone já existente' })
  @Opcional()
  @IsInt()
  id?: number

  @ApiPropertyOptional()
  @OptionalText()
  nome?: string

  @ApiProperty({ example: '(31) 99999-9999' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  telefone!: string
}

export class AparelhoDto {
  @ApiPropertyOptional({ description: 'Presente ao editar um aparelho já existente' })
  @Opcional()
  @IsInt()
  id?: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome!: string

  @ApiPropertyOptional()
  @OptionalText()
  marca?: string

  @ApiPropertyOptional()
  @OptionalText()
  modelo?: string

  @ApiPropertyOptional()
  @OptionalText()
  pnc?: string

  @ApiPropertyOptional()
  @OptionalText(1000)
  observacao?: string
}

export class CreateClienteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome!: string

  @ApiPropertyOptional({ description: 'CPF ou CNPJ' })
  @OptionalText(30)
  cpf?: string

  @ApiPropertyOptional()
  @ValidateIf((_, valor) => valor !== undefined && valor !== '')
  @IsEmail()
  email?: string

  @ApiPropertyOptional() @OptionalText() endereco?: string
  @ApiPropertyOptional() @OptionalText(30) numero?: string
  @ApiPropertyOptional() @OptionalText() complemento?: string
  @ApiPropertyOptional() @OptionalText() bairro?: string
  @ApiPropertyOptional() @OptionalText(20) cep?: string
  @ApiPropertyOptional() @OptionalText(2) uf?: string
  @ApiPropertyOptional() @OptionalText() cidade?: string

  @ApiPropertyOptional()
  @Opcional()
  @IsBoolean()
  negativado?: boolean

  @ApiPropertyOptional()
  @OptionalText(1000)
  motivo?: string

  @ApiPropertyOptional({ enum: RECOMENDACOES })
  @Opcional()
  @IsIn(RECOMENDACOES)
  recomendacao?: Recomendacao

  @ApiPropertyOptional()
  @OptionalText(1000)
  referencia?: string

  @ApiPropertyOptional({ type: [TelefoneDto] })
  @Opcional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelefoneDto)
  telefones?: TelefoneDto[]

  @ApiPropertyOptional({ type: [AparelhoDto] })
  @Opcional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AparelhoDto)
  aparelhos?: AparelhoDto[]
}

/**
 * Na edição, `telefones` e `aparelhos` são a lista final: itens com `id` são atualizados,
 * itens sem `id` são criados e os que não vierem na lista são removidos.
 */
// skipNullProperties: false = `null` também é validado (o PartialType normal o deixa passar e o banco
// devolvia 500 em colunas NOT NULL). Campos que aceitam null de propósito usam @IsOptional() na base.
export class UpdateClienteDto extends PartialType(CreateClienteDto, {
  skipNullProperties: false,
}) {
  /** Como no sistema antigo, a data de cadastro pode ser corrigida (ela conta no relatório). */
  @ApiPropertyOptional({ example: '2024-02-14', description: 'Data de cadastro (yyyy-MM-dd)' })
  @Opcional()
  @DataIso()
  dataCadastro?: string
}

export const CAMPOS_BUSCA_CLIENTE = [
  'id',
  'nome',
  'email',
  'cpf',
  'endereco',
  'cep',
  'telefone',
] as const

export class ClientesQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({ enum: CAMPOS_BUSCA_CLIENTE, description: 'Sem campo, busca em todos' })
  @Opcional()
  @IsIn(CAMPOS_BUSCA_CLIENTE)
  campo?: (typeof CAMPOS_BUSCA_CLIENTE)[number]

  @ApiPropertyOptional()
  @Opcional()
  @IsString()
  busca?: string
}
