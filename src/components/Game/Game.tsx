import './Game.css';

import type { FC } from 'react';

import { GameCanvas } from '../GameCanvas/GameCanvas';
import { GameUI } from '../GameUI/GameUI';
import { useGame } from '../../hooks/useGame';

export const Game: FC = () => {
  const { game, generationNumber, isRunning, speed, size } = useGame();

  return (
    <div className="game">
      <GameCanvas game={game} />
      <GameUI
        isRunning={isRunning}
        speed={speed}
        size={size}
        generationNumber={generationNumber}
        onStart={() => game.start()}
        onStop={() => game.stop()}
        onReset={(size) => game.reset(size)}
        onRandomize={() => game.randomize()}
        onChangeSpeed={(value) => game.changeSpeed(value)}
      />
    </div>
  );
};
