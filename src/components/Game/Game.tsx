import './Game.css';

import type { FC } from 'react';

import { GameCanvas } from '../GameCanvas/GameCanvas';

export const Game: FC = () => {
  return (
    <div className="game">
      <GameCanvas />
    </div>
  );
};
