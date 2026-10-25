import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  usuario!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  senha!: string
}

export class SetupDto {
  @ApiProperty({ example: 'admin' })
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
}
