import { NumberState, type NumberState as NumberStateValue } from '@monitor/shared';

type Translator = (pt: string, en: string) => string;

const LABELS: Record<NumberStateValue, readonly [string, string]> = {
  [NumberState.UNKNOWN]: ['Desconhecido', 'Unknown'],
  [NumberState.CONNECTED]: ['Conectado', 'Connected'],
  [NumberState.DISCONNECTED]: ['Desconectado', 'Disconnected'],
  [NumberState.CONNECTING]: ['Conectando', 'Connecting'],
  [NumberState.RESTARTING]: ['Reiniciando', 'Restarting'],
  [NumberState.ERROR]: ['Erro', 'Error'],
};

export function formatNumberStateLabel(state: string, t: Translator): string {
  const pair = LABELS[state as NumberStateValue];
  return pair ? t(pair[0], pair[1]) : state;
}
