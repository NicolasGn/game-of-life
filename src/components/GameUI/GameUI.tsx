import './GameUI.css';

import type { FC } from 'react';

const SpeedOptions = [1, 2, 5, 10, 25, 50, 100];

export type GameUIProps = {
  isRunning: boolean;
  speed: number;
  generationNumber: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onRandomize: () => void;
  onChangeSpeed: (value: number) => void;
};

export const GameUI: FC<GameUIProps> = ({
  generationNumber,
  isRunning,
  speed,
  onStart,
  onStop,
  onReset,
  onRandomize,
  onChangeSpeed,
}) => {
  return (
    <div className="game-ui">
      <section>
        <h3>Generation: {generationNumber}</h3>
        {isRunning ? (
          <button onClick={onStop}>Stop</button>
        ) : (
          <button onClick={onStart}>Start</button>
        )}
        <button disabled={isRunning} onClick={onReset}>
          Reset
        </button>
        <button disabled={isRunning} onClick={onRandomize}>
          Randomize
        </button>
      </section>

      <section>
        <h3>Speed: {speed}</h3>
        {SpeedOptions.map((option) => {
          const isCurrentSpeed = option === speed;
          return (
            <button
              className={isCurrentSpeed ? 'active' : ''}
              disabled={isCurrentSpeed}
              onClick={() => onChangeSpeed(option)}
            >
              x&nbsp;{option}
            </button>
          );
        })}
      </section>
    </div>
  );
};
