export function formatarCpfCnpj(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 11) {
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  }
  return numeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

export function formatarTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  }
  return numeros
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

export function formatarMoedaBrl(valor?: number | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return 'R$ 0,00';
  }
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatarDataBr(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 8);
  if (numeros.length <= 2) {
    return numeros;
  }
  if (numeros.length <= 4) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

export function formatarHora(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 4);
  if (numeros.length <= 2) {
    return numeros;
  }
  return `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
}

export function validarDataBr(data?: string | null): boolean {
  if (!data || !data.trim()) return false;
  const match = data.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const dia = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const ano = parseInt(match[3], 10);
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;
  if (ano < 1900 || ano > 2100) return false;
  const diasNoMes = new Date(ano, mes, 0).getDate();
  return dia <= diasNoMes;
}

export function validarHora(hora?: string | null): boolean {
  if (!hora || !hora.trim()) return false;
  const match = hora.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}
