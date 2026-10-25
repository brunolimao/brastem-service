import { ROLES, type Role } from '@brastem/shared'
import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateUsuarioDto {
  @ApiProperty({ example: 'maria' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  usuario!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  senha!: string

  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: Role
}

export class UsuarioResponseDto {
  @ApiProperty() id!: number
  @ApiProperty() usuario!: string
  @ApiProperty({ enum: ROLES }) role!: Role
  @ApiProperty() ativo!: boolean
  @ApiProperty() criadoEm!: string
}
