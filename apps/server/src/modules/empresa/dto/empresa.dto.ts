import { ApiProperty } from '@nestjs/swagger'
import { OptionalText } from '../../../common/validation/decorators.js'

export class EmpresaDto {
  @ApiProperty({ required: false, example: 'Minha Assistência Técnica' })
  @OptionalText(120)
  nome?: string

  @ApiProperty({ required: false, example: '00.000.000/0000-00' })
  @OptionalText(30)
  cnpj?: string

  @ApiProperty({ required: false, example: '(00) 0000-0000' })
  @OptionalText(30)
  telefone?: string

  @ApiProperty({ required: false, example: 'Rua Exemplo, nº 100 · Bairro · Cidade - UF' })
  @OptionalText(200)
  endereco?: string

  @ApiProperty({ required: false, example: '00000-000' })
  @OptionalText(20)
  cep?: string
}
