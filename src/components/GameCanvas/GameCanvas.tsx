import './GameCanvas.css';

import { useCallback, useEffect, useRef, useState, type FC } from 'react';

const Colors = {
  Cell: {
    Alive: '#14d037',
    Dead: '#000',
  },
  Grid: '#555',
} as const;

const GRID_SIZE = 32;

type DrawFunction = (ctx: CanvasRenderingContext2D) => void;

const computeCellSize = () => Math.trunc(window.innerHeight / GRID_SIZE);

export const GameCanvas: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cells] = useState(
    new Array<boolean>(GRID_SIZE * GRID_SIZE)
      .fill(false)
      .map(() => Math.random() > 0.5)
  );

  const [cellSize, setCellSize] = useState(computeCellSize());
  const [canvasSize, setCanvasSize] = useState(cellSize * GRID_SIZE);

  /**
   * Function to draw content on the 2D canvas.
   */
  const render = useCallback((draw: DrawFunction) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error('Canvas ref not defined');
    }

    const renderingContext = canvas.getContext('2d');

    if (!renderingContext) {
      throw new Error('2D rendering not supported by canvas');
    }

    draw(renderingContext);
  }, []);

  useEffect(() => {
    render((ctx) => {
      ctx.fillStyle = Colors.Cell.Dead;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.lineWidth = 1;
      ctx.strokeStyle = Colors.Grid;
      ctx.fillStyle = Colors.Cell.Alive;
      ctx.beginPath();

      for (let line = 0; line < GRID_SIZE; ++line) {
        for (let column = 0; column < GRID_SIZE; ++column) {
          const isAlive = cells[line * GRID_SIZE + column];

          if (isAlive) {
            ctx.rect(column * cellSize, line * cellSize, cellSize, cellSize);
          }
        }
      }

      ctx.fill();
      ctx.stroke();
    });
  }, [cells, cellSize, render]);

  /**
   * Connect window event listeners.
   */
  useEffect(() => {
    const handleResize = () => {
      const newCellSize = computeCellSize();
      setCellSize(newCellSize);
      setCanvasSize(newCellSize * GRID_SIZE);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={canvasSize}
      height={canvasSize}
    >
      Game canvas
    </canvas>
  );
};
