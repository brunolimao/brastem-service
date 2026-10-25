import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { type Db, DRIZZLE } from '../../common/database/index.js'
import { type DumpLegado, decodificarDump, lerDump } from '../../legacy/dump-parser.js'
import { migrarDoDump, type RelatorioMigracao } from '../../legacy/migrar.js'
import { UsuariosService } from '../usuarios/usuarios.service.js'

const TABELAS_ESPERADAS = ['Clientes', 'OrdemServicos', 'Pagamentos', 'Parcelas']

@Injectable()
export class ImportacaoService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly usuarios: UsuariosService,
  ) {}

  /** Importa o .sql do sistema antigo. Só funciona num sistema recém-instalado, antes de criar usuários. */
  async importarLegado(arquivo: Buffer): Promise<RelatorioMigracao> {
    if (this.usuarios.total() > 0) {
      throw new ForbiddenException(
        'A importação só pode ser feita no primeiro uso, antes de criar usuários.',
      )
    }
    if (!Buffer.isBuffer(arquivo) || arquivo.length === 0) {
      throw new BadRequestException('Envie o arquivo .sql do sistema antigo.')
    }

    const texto = decodificarDump(arquivo)
    if (!texto.includes('CREATE TABLE')) {
      throw new BadRequestException('Este arquivo não parece um dump do MySQL (.sql).')
    }

    let dump: DumpLegado
    try {
      dump = lerDump(texto)
    } catch {
      throw new BadRequestException('Não consegui ler o arquivo. Ele está completo e sem edições?')
    }
    if (!TABELAS_ESPERADAS.some((tabela) => dump[tabela] !== undefined)) {
      throw new BadRequestException('Não encontrei os dados do sistema antigo neste arquivo.')
    }

    try {
      return await migrarDoDump(this.db, dump)
    } catch (erro) {
      if (erro instanceof Error && erro.message.includes('já tem clientes')) {
        throw new ConflictException('Este sistema já tem clientes cadastrados.')
      }
      throw erro
    }
  }
}
