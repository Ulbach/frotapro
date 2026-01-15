
export interface VehicleLog {
  id?: string;
  veiculo: string;
  motorista: string;
  seguranca: string;
  kmSaida: number;
  destino: string;
  dataSaida: string;
  status: 'FORA' | 'DISPONÍVEL';
  kmRetorno?: number;
  kmRodado?: number;
  dataRetorno?: string;
}

export interface ListagemData {
  veiculos: string[];
  motoristas: string[];
  segurancas: string[];
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  SAIDA = 'SAIDA',
  RETORNO = 'RETORNO',
  HISTORICO = 'HISTORICO'
}
