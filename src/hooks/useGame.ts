import { useEffect, useMemo, useState } from 'react';
import {
  Game,
  type OnGridChangedEvent,
  type OnNewGenerationEvent,
} from '../core/game';

export const useGame = () => {
  const [game] = useState(new Game());

  const [size, setSize] = useState(game.getSize());
  const [speed, setSpeed] = useState(game.getSpeed());
  const [isRunning, setIsRunning] = useState(game.getIsRunning());
  const [generationNumber, setGenerationNumber] = useState(
    game.getGenerationNumber()
  );

  useEffect(() => {
    const handleStart = () => {
      setIsRunning(true);
    };

    const handleStop = () => {
      setIsRunning(false);
    };

    const handleReset = () => {
      setGenerationNumber(0);
    };

    const handleGridChanged = (event: OnGridChangedEvent) => {
      setSize(event.size);
    };

    const handleSpeedChanged = (newSpeed: number) => {
      setSpeed(newSpeed);
    };

    const handleNewGeneration = (event: OnNewGenerationEvent) => {
      setGenerationNumber(event.generationNumber);
    };

    game.onStart.subscribe(handleStart);
    game.onStop.subscribe(handleStop);
    game.onReset.subscribe(handleReset);
    game.onGridChanged.subscribe(handleGridChanged);
    game.onSpeedChanged.subscribe(handleSpeedChanged);
    game.onNewGeneration.subscribe(handleNewGeneration);

    return () => {
      game.onStart.unsubscribe(handleStart);
      game.onStop.unsubscribe(handleStop);
      game.onReset.unsubscribe(handleReset);
      game.onGridChanged.unsubscribe(handleGridChanged);
      game.onSpeedChanged.unsubscribe(handleSpeedChanged);
      game.onNewGeneration.unsubscribe(handleNewGeneration);
    };
  }, [game]);

  const result = useMemo(() => {
    return {
      game,
      size,
      speed,
      isRunning,
      generationNumber,
    };
  }, [game, size, speed, isRunning, generationNumber]);

  return result;
};
