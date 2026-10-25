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
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { PaginacaoQueryDto } from '../../../common/utils/pagination.js'
import { OptionalText } from '../../../common/validation/decorators.js'

export class TelefoneDto {
  @ApiPropertyOptional({ description: 'Presente ao editar um telefone já existente' })
  @IsOptional()
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
  @IsOptional()
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
  @IsOptional()
  @IsBoolean()
  negativado?: boolean

  @ApiPropertyOptional()
  @OptionalText(1000)
  motivo?: string

  @ApiPropertyOptional({ enum: RECOMENDACOES })
  @IsOptional()
  @IsIn(RECOMENDACOES)
  recomendacao?: Recomendacao

  @ApiPropertyOptional()
  @OptionalText(1000)
  referencia?: string

  @ApiPropertyOptional({ type: [TelefoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelefoneDto)
  telefones?: TelefoneDto[]

  @ApiPropertyOptional({ type: [AparelhoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AparelhoDto)
  aparelhos?: AparelhoDto[]
}

/**
 * Na edição, `telefones` e `aparelhos` são a lista final: itens com `id` são atualizados,
 * itens sem `id` são criados e os que não vierem na lista são removidos.
 */
export class UpdateClienteDto extends PartialType(CreateClienteDto) {}

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
  @IsOptional()
  @IsIn(CAMPOS_BUSCA_CLIENTE)
  campo?: (typeof CAMPOS_BUSCA_CLIENTE)[number]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  busca?: string
}
