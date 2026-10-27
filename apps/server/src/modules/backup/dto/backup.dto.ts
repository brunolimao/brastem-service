import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class CredenciaisGoogleDto {
  @ApiProperty({ example: '1234567890-abc.apps.googleusercontent.com' })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  clientId!: string

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  clientSecret!: string
}

export class ApagarTudoDto {
  @ApiProperty({ description: 'Senha de quem está logado, para confirmar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  senha!: string
}

export class RestaurarDto {
  @ApiProperty({ enum: ['local', 'drive'] })
  @IsIn(['local', 'drive'])
  origem!: 'local' | 'drive'

  @ApiProperty({ description: 'Nome do arquivo (local) ou id do arquivo (Drive)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  id!: string
}
