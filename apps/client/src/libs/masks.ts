export const apenasDigitos = (valor: string) => valor.replace(/\D/g, '')

/** CPF (000.000.000-00) até 11 dígitos; acima disso vira CNPJ (00.000.000/0000-00). */
export function mascararCpfCnpj(valor: string) {
  const d = apenasDigitos(valor).slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

/** (00) 0000-0000 ou (00) 00000-0000. */
export function mascararTelefone(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return d.replace(/^(\d{2})(\d+)/, '($1) $2')
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3')
  return d.replace(/^(\d{2})(\d{5})(\d+)/, '($1) $2-$3')
}

/** 00000-000. */
export function mascararCep(valor: string) {
  const d = apenasDigitos(valor).slice(0, 8)
  return d.length > 5 ? d.replace(/^(\d{5})(\d+)/, '$1-$2') : d
}
