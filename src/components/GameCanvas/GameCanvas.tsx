import './GameCanvas.css';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
} from 'react';

import type { Cell, Game, OnNewGenerationEvent } from '../../core/game';

const MaxViewportSize = 16;

const DefaultViewportSize = 32;

const ZoomSpeed = 0.001;

const MinCellSize = 8;

const MaxShapePerDrawCall = 425000;

const Colors = {
  Cell: '#14d037',
  Background: '#000',
  Grid: '#555',
} as const;

const computeCellSize = (gridSize: number) =>
  Math.max(Math.trunc(window.innerHeight / gridSize), MinCellSize);

export type GameCanvasProps = {
  game: Game;
};

export const GameCanvas: FC<GameCanvasProps> = ({ game }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cellSize, setCellSize] = useState(computeCellSize(game.getSize()));
  const [canvasSize, setCanvasSize] = useState(cellSize * game.getSize());
  const [canvasTransform, setCanvasTransform] = useState({
    x: 0,
    y: 0,
    scale: Math.max(game.getSize() / DefaultViewportSize, 1),
  });

  /**
   * Function to draw content on the 2D canvas.
   */
  const render = useCallback(
    (draw: (ctx: CanvasRenderingContext2D) => void) => {
      const canvas = canvasRef.current;

      if (!canvas) {
        throw new Error('Canvas ref not defined');
      }

      const renderingContext = canvas.getContext('2d', { alpha: false });

      if (!renderingContext) {
        throw new Error('2D rendering not supported by canvas');
      }

      window.requestAnimationFrame(() => {
        draw(renderingContext);
      });
    },
    []
  );

  /**
   * Draw cells with a given color.
   */
  const drawCells = useCallback(
    (cells: Cell[], color: string) => {
      render((ctx) => {
        ctx.strokeStyle = Colors.Grid;
        ctx.fillStyle = color;

        let shapeCount = 0;
        ctx.beginPath();

        for (const cell of cells) {
          const { column, line } = cell;

          ctx.rect(column * cellSize, line * cellSize, cellSize, cellSize);

          shapeCount += 1;

          if (shapeCount >= MaxShapePerDrawCall) {
            ctx.fill();
            ctx.stroke();

            shapeCount = 0;
            ctx.beginPath();
          }
        }

        if (shapeCount > 0) {
          ctx.fill();
          ctx.stroke();
        }
      });
    },
    [cellSize, render]
  );

  /**
   * Draw the full grid.
   */
  const drawGrid = useCallback(() => {
    render((ctx) => {
      ctx.fillStyle = Colors.Background;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });

    const cells = game.getCells();
    const aliveCells = new Array<Cell>();
    const deadCells = new Array<Cell>();

    cells.forEach((cell) => {
      if (cell.isAlive) {
        aliveCells.push(cell);
      } else {
        deadCells.push(cell);
      }
    });

    drawCells(deadCells, Colors.Background);
    drawCells(aliveCells, Colors.Cell);
  }, [game, drawCells, render]);

  /**
   * Update the canvas transform given a zoom delta and a focal point.
   */
  const zoomCanvas = useCallback(
    (delta: number, focal: { x: number; y: number }) => {
      setCanvasTransform((currentTransform) => {
        const { x, y, scale } = currentTransform;

        const newScale = Math.min(
          Math.max(scale + delta * ZoomSpeed, 1.0),
          Math.max(game.getSize() / MaxViewportSize, 1)
        );

        if (newScale === scale) {
          return currentTransform;
        }

        const panMargin = canvasSize * newScale - canvasSize;

        const newX = Math.min(
          Math.max(focal.x - (focal.x - x) * (newScale / scale), -panMargin),
          0
        );

        const newY = Math.min(
          Math.max(focal.y - (focal.y - y) * (newScale / scale), -panMargin),
          0
        );

        return {
          x: newX,
          y: newY,
          scale: newScale,
        };
      });
    },
    [game, canvasSize]
  );

  /**
   * Update the canvas transform given an panning (x,y) delta.
   */
  const panCanvas = useCallback(
    (pan: { x: number; y: number }) => {
      if (pan.x === 0 && pan.y === 0) {
        return;
      }

      setCanvasTransform((currentTransform) => {
        const { x, y, scale } = currentTransform;

        const panMargin = canvasSize * scale - canvasSize;
        const newX = Math.min(Math.max(x + pan.x, -panMargin), 0);
        const newY = Math.min(Math.max(y + pan.y, -panMargin), 0);

        if (newX == x && newY == y) {
          return currentTransform;
        }

        return {
          ...currentTransform,
          x: newX,
          y: newY,
        };
      });
    },
    [canvasSize]
  );

  /**
   * Connect window event listeners.
   */
  useEffect(() => {
    const handleResize = () => {
      const gridSize = game.getSize();
      const newCellSize = computeCellSize(gridSize);

      setCellSize(newCellSize);
      setCanvasSize(newCellSize * gridSize);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [game]);

  /**
   * Connect canvas event listeners to manage pan & zoom.
   */
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error('Canvas ref not defined');
    }

    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    /**
     * Compute the ratio between canvas resolution and its size in the page.
     */
    const computeResolutionRatio = () =>
      canvas.height / canvas.getBoundingClientRect().height;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const resolutionRatio = computeResolutionRatio();

      zoomCanvas(event.deltaY, {
        x: event.offsetX * resolutionRatio,
        y: event.offsetY * resolutionRatio,
      });
    };

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      isMouseDown = true;
    };

    const handleMouseUp = (event: MouseEvent) => {
      event.preventDefault();
      isMouseDown = false;
    };

    const handleMouseLeave = (event: MouseEvent) => {
      event.preventDefault();
      isMouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();

      if (isMouseDown) {
        const resolutionRatio = computeResolutionRatio();

        panCanvas({
          x: (event.offsetX - lastMouseX) * resolutionRatio,
          y: (event.offsetY - lastMouseY) * resolutionRatio,
        });
      }

      lastMouseX = event.offsetX;
      lastMouseY = event.offsetY;
    };

    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [game, zoomCanvas, panCanvas]);

  /**
   * Connect canvas event listeners to manage cell interactions.
   */
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error('Canvas ref not defined');
    }

    const renderingContext = canvas.getContext('2d');

    if (!renderingContext) {
      throw new Error('2D rendering not supported by canvas');
    }

    const getCellUnderMouse = (mouseX: number, mouseY: number): Cell => {
      const resolutionRatio =
        canvas.height / canvas.getBoundingClientRect().height;

      const transform = renderingContext.getTransform();
      const scaleInverse = 1 / transform.a;

      const x = (mouseX * resolutionRatio - transform.e) * scaleInverse;
      const y = (mouseY * resolutionRatio - transform.f) * scaleInverse;

      const line = Math.trunc(y / cellSize);
      const column = Math.trunc(x / cellSize);

      return game.getCell(line, column);
    };

    let mouseDownOrigin: {
      x: number;
      y: number;
    } | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      mouseDownOrigin = {
        x: event.offsetX,
        y: event.offsetY,
      };
    };

    const handleMouseUp = (event: MouseEvent) => {
      event.preventDefault();

      if (!mouseDownOrigin) {
        return;
      }

      const distX = mouseDownOrigin.x - event.offsetX;
      const distY = mouseDownOrigin.y - event.offsetY;
      const distSquared = distX * distX + distY * distY;

      if (distSquared < 1) {
        const cell = getCellUnderMouse(event.offsetX, event.offsetY);
        game.toggleCell(cell.line, cell.column);
      }

      mouseDownOrigin = null;
    };

    const handleMouseLeave = (event: MouseEvent) => {
      event.preventDefault();
      mouseDownOrigin = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [game, cellSize]);

  /**
   * Clear and redraw canvas when transform is updated.
   */
  useLayoutEffect(() => {
    render((ctx) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      ctx.fillStyle = Colors.Background;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const { scale, x, y } = canvasTransform;

      ctx.setTransform(scale, 0, 0, scale, x, y);
    });

    drawGrid();
  }, [render, drawGrid, canvasTransform]);

  /**
   * Connect game event listeners.
   */
  useEffect(() => {
    const handleGridChanged = () => {
      drawGrid();
    };

    const handleNewGeneration = (event: OnNewGenerationEvent) => {
      drawCells(event.killedCells, Colors.Background);
      drawCells(event.bornCells, Colors.Cell);
    };

    const handleCellChanged = (cell: Cell) => {
      drawCells([cell], cell.isAlive ? Colors.Cell : Colors.Background);
    };

    const handleReset = () => {
      const gridSize = game.getSize();
      const newCellSize = computeCellSize(gridSize);

      setCellSize(newCellSize);
      setCanvasSize(newCellSize * gridSize);
      setCanvasTransform({
        x: 0,
        y: 0,
        scale: Math.max(gridSize / DefaultViewportSize, 1),
      });
    };

    game.onGridChanged.subscribe(handleGridChanged);
    game.onNewGeneration.subscribe(handleNewGeneration);
    game.onCellChanged.subscribe(handleCellChanged);
    game.onReset.subscribe(handleReset);

    return () => {
      game.onGridChanged.unsubscribe(handleGridChanged);
      game.onNewGeneration.unsubscribe(handleNewGeneration);
      game.onCellChanged.unsubscribe(handleCellChanged);
      game.onReset.unsubscribe(handleReset);
    };
  }, [game, drawCells, drawGrid]);

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
