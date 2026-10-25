import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { type Db, DRIZZLE, schema } from '../../common/database/index.js'
import type { EmpresaDto } from './dto/empresa.dto.js'

const { empresa } = schema

const ID = 1

@Injectable()
export class EmpresaService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  /** Sem nada preenchido, devolve tudo vazio (a impressão mostra só o nome do sistema). */
  obter() {
    const salvo = this.db.select().from(empresa).where(eq(empresa.id, ID)).get()
    return {
      nome: salvo?.nome ?? '',
      cnpj: salvo?.cnpj ?? '',
      telefone: salvo?.telefone ?? '',
      endereco: salvo?.endereco ?? '',
      cep: salvo?.cep ?? '',
    }
  }

  salvar(dto: EmpresaDto) {
    const valores = {
      nome: dto.nome?.trim() ?? '',
      cnpj: dto.cnpj?.trim() ?? '',
      telefone: dto.telefone?.trim() ?? '',
      endereco: dto.endereco?.trim() ?? '',
      cep: dto.cep?.trim() ?? '',
    }
    this.db
      .insert(empresa)
      .values({ id: ID, ...valores })
      .onConflictDoUpdate({ target: empresa.id, set: valores })
      .run()
    return this.obter()
  }
}
