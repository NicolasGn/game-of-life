import './Game.css';

import type { FC } from 'react';

import { GameCanvas } from '../GameCanvas/GameCanvas';
import { GameUI } from '../GameUI/GameUI';
import { useGame } from '../../hooks/useGame';

export const Game: FC = () => {
  const { game, generationNumber, isRunning, speed } = useGame();

  return (
    <div className="game">
      <GameCanvas game={game} />
      <GameUI
        generationNumber={generationNumber}
        isRunning={isRunning}
        speed={speed}
        onStart={() => game.start()}
        onStop={() => game.stop()}
        onReset={() => game.reset()}
        onRandomize={() => game.randomize()}
        onChangeSpeed={(value) => game.changeSpeed(value)}
      />
    </div>
  );
};
