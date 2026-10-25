import { NsisUpdater } from 'electron-updater'
import { ElectronAppAdapter } from 'electron-updater/out/ElectronAppAdapter'
import { ElectronHttpExecutor } from 'electron-updater/out/electronHttpExecutor'
import { escolherPastaDeCache } from './cache-atualizacao'

type AppDoElectron = ConstructorParameters<typeof ElectronAppAdapter>[0]

/** Igual ao adaptador padrão do electron-updater, mas com a pasta de cache que escolhemos. */
class AdaptadorComCache extends ElectronAppAdapter {
  constructor(
    private readonly pastaDeCache: string,
    app?: AppDoElectron,
  ) {
    super(app)
  }

  override get baseCachePath(): string {
    return this.pastaDeCache
  }
}

/**
 * Cria o atualizador do Windows guardando o instalador baixado na primeira pasta (da lista de
 * candidatas, em ordem de preferência) onde renomear arquivos funciona. A primeira deve ser a
 * pasta padrão do electron-updater, para o comportamento normal não mudar.
 *
 * `app` só existe para os testes (fora do Electron não há `electron.app`).
 */
export function criarAtualizador(
  candidatas: string[],
  registrar: (mensagem: string) => void,
  app?: AppDoElectron,
) {
  const pasta = escolherPastaDeCache(candidatas)
  if (pasta !== candidatas[0]) {
    registrar(
      `A pasta padrão de atualização não aceita renomear arquivos; usando ${pasta ?? candidatas[0]}.`,
    )
  }

  const atualizador = new NsisUpdater(
    undefined,
    new AdaptadorComCache(pasta ?? (candidatas[0] as string), app),
  )
  // Com adaptador próprio o pacote deixa o cliente HTTP vazio ("traga o seu"), e toda checagem falha
  // com "Cannot read properties of null (reading 'request')". Por isso a versão do pacote é fixa.
  ;(atualizador as unknown as { httpExecutor: unknown }).httpExecutor = new ElectronHttpExecutor(
    (authInfo, callback) => atualizador.emit('login', authInfo, callback),
  )
  return atualizador
}
