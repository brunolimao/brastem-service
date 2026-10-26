import { Module } from '@nestjs/common'
import { SistemaController } from './sistema.controller.js'

@Module({ controllers: [SistemaController] })
export class SistemaModule {}
