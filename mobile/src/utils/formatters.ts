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

export function dataParaStringBr(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function horaParaString(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function stringBrParaData(dataBr?: string | null, horaBr?: string | null): Date {
  const agora = new Date();
  if (!dataBr || !validarDataBr(dataBr)) {
    return agora;
  }
  const matchData = dataBr.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!matchData) return agora;
  const dia = parseInt(matchData[1], 10);
  const mes = parseInt(matchData[2], 10) - 1;
  const ano = parseInt(matchData[3], 10);

  let hora = agora.getHours();
  let minuto = agora.getMinutes();

  if (horaBr && validarHora(horaBr)) {
    const matchHora = horaBr.trim().match(/^(\d{2}):(\d{2})$/);
    if (matchHora) {
      hora = parseInt(matchHora[1], 10);
      minuto = parseInt(matchHora[2], 10);
    }
  }

  const d = new Date(ano, mes, dia, hora, minuto, 0, 0);
  return isNaN(d.getTime()) ? agora : d;
}

export function adicionarDiasDataBr(dias: number, baseDate?: Date): string {
  const base = baseDate ? new Date(baseDate.getTime()) : new Date();
  base.setDate(base.getDate() + dias);
  return dataParaStringBr(base);
}

export function dataBrParaIsoInput(dataBr?: string | null): string {
  if (!dataBr || !validarDataBr(dataBr)) {
    return '';
  }
  const match = dataBr.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, dia, mes, ano] = match;
  return `${ano}-${mes}-${dia}`;
}

export const NOMES_MESES_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface DiaCalendarioInfo {
  dia: number;
  mesAtual: boolean;
  dataBr: string;
}

export function gerarDiasCalendarioMes(ano: number, mesBaseZero: number): DiaCalendarioInfo[] {
  const primeiroDiaSemana = new Date(ano, mesBaseZero, 1).getDay();
  const totalDiasMes = new Date(ano, mesBaseZero + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(ano, mesBaseZero, 0).getDate();

  const dias: DiaCalendarioInfo[] = [];

  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const diaNum = totalDiasMesAnterior - i;
    const mesAnt = mesBaseZero === 0 ? 11 : mesBaseZero - 1;
    const anoAnt = mesBaseZero === 0 ? ano - 1 : ano;
    const dStr = `${String(diaNum).padStart(2, '0')}/${String(mesAnt + 1).padStart(2, '0')}/${anoAnt}`;
    dias.push({ dia: diaNum, mesAtual: false, dataBr: dStr });
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dStr = `${String(dia).padStart(2, '0')}/${String(mesBaseZero + 1).padStart(2, '0')}/${ano}`;
    dias.push({ dia, mesAtual: true, dataBr: dStr });
  }

  const sobra = dias.length % 7;
  if (sobra !== 0) {
    const faltam = 7 - sobra;
    const mesProx = mesBaseZero === 11 ? 0 : mesBaseZero + 1;
    const anoProx = mesBaseZero === 11 ? ano + 1 : ano;
    for (let dia = 1; dia <= faltam; dia++) {
      const dStr = `${String(dia).padStart(2, '0')}/${String(mesProx + 1).padStart(2, '0')}/${anoProx}`;
      dias.push({ dia, mesAtual: false, dataBr: dStr });
    }
  }

  return dias;
}

export function ajustarMinutosHoraBr(horaBr: string, deltaMinutos: number): string {
  let h = 9;
  let m = 0;
  if (horaBr && validarHora(horaBr)) {
    const parts = horaBr.split(':');
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
  }
  let totalMin = h * 60 + m + deltaMinutos;
  if (totalMin < 0) totalMin = 24 * 60 + (totalMin % (24 * 60));
  totalMin = totalMin % (24 * 60);

  const novoH = Math.floor(totalMin / 60);
  const novoM = totalMin % 60;
  return `${String(novoH).padStart(2, '0')}:${String(novoM).padStart(2, '0')}`;
}
