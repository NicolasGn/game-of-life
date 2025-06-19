import './GameUI.css';

import { useRef, type FC } from 'react';

import {
  ChangeSizeModal,
  type ChangeSizeModalHandle,
} from './components/ChangeSizeModal/ChangeSizeModal';

const SpeedOptions = [1, 2, 5, 10, 25, 50, 100];

export type GameUIProps = {
  isRunning: boolean;
  speed: number;
  size: number;
  generationNumber: number;
  onStart: () => void;
  onStop: () => void;
  onReset: (size?: number) => void;
  onRandomize: () => void;
  onChangeSpeed: (value: number) => void;
};

export const GameUI: FC<GameUIProps> = ({
  isRunning,
  speed,
  size,
  generationNumber,
  onStart,
  onStop,
  onReset,
  onRandomize,
  onChangeSpeed,
}) => {
  const changeSizeModalRef = useRef<ChangeSizeModalHandle>(null);

  return (
    <div className="game-ui">
      <section>
        <h3>Generation: {generationNumber}</h3>
        {isRunning ? (
          <button onClick={onStop}>Stop</button>
        ) : (
          <button onClick={onStart}>Start</button>
        )}
        <button disabled={isRunning} onClick={onRandomize}>
          Randomize
        </button>
        <button disabled={isRunning} onClick={() => onReset()}>
          Reset
        </button>
        <button
          disabled={isRunning}
          onClick={() => changeSizeModalRef.current?.open()}
        >
          Change size
        </button>
      </section>

      <section>
        <h3>Speed: {speed}</h3>
        {SpeedOptions.map((option) => {
          const isCurrentSpeed = option === speed;
          return (
            <button
              key={option}
              className={isCurrentSpeed ? 'active' : ''}
              disabled={isCurrentSpeed}
              onClick={() => onChangeSpeed(option)}
            >
              x&nbsp;{option}
            </button>
          );
        })}
      </section>
      <ChangeSizeModal
        ref={changeSizeModalRef}
        currentSize={size}
        onConfirm={(value) => onReset(value)}
      />
    </div>
  );
};
