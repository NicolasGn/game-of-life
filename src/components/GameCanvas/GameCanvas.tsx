import './GameCanvas.css';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
} from 'react';

const GridSize = 128;

const MaxViewportSize = 16;

const DefaultViewportSize = 32;

const CellBorderWidth = 1;

const MinCellSize = 8;

const MaxShapePerDrawCall = 425000;

const Colors = {
  Cell: '#14d037',
  Background: '#000',
  Grid: '#555',
} as const;

const Zoom = {
  Min: 1,
  Max: Math.max(GridSize / MaxViewportSize, 1),
  Speed: 0.001,
} as const;

const computeCellSize = () =>
  Math.max(Math.trunc(window.innerHeight / GridSize), MinCellSize);

export const GameCanvas: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cells] = useState(
    new Array<boolean>(GridSize * GridSize)
      .fill(false)
      .map(() => Math.random() > 0.5)
  );

  const [cellSize, setCellSize] = useState(computeCellSize());
  const [canvasSize, setCanvasSize] = useState(cellSize * GridSize);
  const [canvasTransform, setCanvasTransform] = useState({
    x: 0,
    y: 0,
    scale: Math.max(GridSize / DefaultViewportSize, 1),
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

      const renderingContext = canvas.getContext('2d');

      if (!renderingContext) {
        throw new Error('2D rendering not supported by canvas');
      }

      draw(renderingContext);
    },
    []
  );

  /**
   * Draw alive or dead cells only.
   */
  const drawCells = useCallback(
    (isAlive: boolean) => {
      render((ctx) => {
        ctx.lineWidth = CellBorderWidth;
        ctx.strokeStyle = Colors.Grid;
        ctx.fillStyle = isAlive ? Colors.Cell : Colors.Background;

        let shapeCount = 0;
        ctx.beginPath();

        for (let line = 0; line < GridSize; ++line) {
          for (let column = 0; column < GridSize; ++column) {
            if (cells[line * GridSize + column] === isAlive) {
              ctx.rect(column * cellSize, line * cellSize, cellSize, cellSize);

              shapeCount += 1;

              if (shapeCount >= MaxShapePerDrawCall) {
                ctx.fill();
                ctx.stroke();

                shapeCount = 0;
                ctx.beginPath();
              }
            }
          }
        }

        if (shapeCount > 0) {
          ctx.fill();
          ctx.stroke();
        }
      });
    },
    [cells, cellSize, render]
  );

  /**
   * Draw the full grid.
   */
  const drawGrid = useCallback(() => {
    render((ctx) => {
      ctx.fillStyle = Colors.Background;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });

    drawCells(true);
    drawCells(false);
  }, [drawCells, render]);

  /**
   * Update the canvas transform given a zoom delta and a focal point.
   */
  const zoomCanvas = useCallback(
    (delta: number, focal: { x: number; y: number }) => {
      setCanvasTransform((currentTransform) => {
        const { x, y, scale } = currentTransform;

        const newScale = Math.min(
          Math.max(scale + delta * Zoom.Speed, Zoom.Min),
          Zoom.Max
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
    [canvasSize]
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
      const newCellSize = computeCellSize();

      setCellSize(newCellSize);
      setCanvasSize(newCellSize * GridSize);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * Connect canvas event listeners.
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
      window.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [zoomCanvas, panCanvas]);

  /**
   * Clear and redraw canvas when transform is updated.
   */
  useLayoutEffect(() => {
    render((ctx) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      ctx.fillStyle = Colors.Cell;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const { scale, x, y } = canvasTransform;

      ctx.setTransform(scale, 0, 0, scale, x, y);
    });

    drawGrid();
  }, [render, drawGrid, canvasTransform]);

  /**
   * Intial draw.
   */
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

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
