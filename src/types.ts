export type BattleResult = {
  wins: boolean;
  explanation: string;
};

export type GameItem = {
  id: string;
  name: string; // The item name, e.g. "sasso"
  explanation?: string; // Why it beat the previous item or why it lost
  isLoss?: boolean; // True if this item failed to beat the previous
};
