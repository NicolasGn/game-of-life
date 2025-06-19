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
        onExport={() => {
          const json = game.exportToJson();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = 'game-of-life.json';
          link.click();

          URL.revokeObjectURL(url);
        }}
        onLoad={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/json';

          input.addEventListener('change', () => {
            const [file] = input.files ?? [];

            if (!file) {
              return;
            }

            const reader = new FileReader();

            reader.addEventListener('load', () => {
              if (reader.result && typeof reader.result === 'string') {
                game.loadFromJson(reader.result);
              }
            });

            reader.readAsText(file);
          });

          input.click();
        }}
      />
    </div>
  );
};
