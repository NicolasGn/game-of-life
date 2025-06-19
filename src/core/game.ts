import { EventEmitter } from './events';

export type Cell = {
  id: number;
  line: number;
  column: number;
  isAlive: boolean;
};

export type OnGridChangedEvent = {
  size: number;
  cells: Cell[];
};

export type OnNewGenerationEvent = {
  generationNumber: number;
  bornCells: Cell[];
  killedCells: Cell[];
};

export class Game {
  public static readonly MinSize = 3;

  public static readonly MaxSize = 1024;

  public static readonly DefaultSize = 128;

  public static readonly MinSpeed = 1.0;

  public static readonly MaxSpeed = 100.0;

  private static readonly NeighbourOffsets = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ];

  private cells: Cell[];

  private size: number;

  private speed: number;

  private generationNumber: number;

  private isRunning: boolean;

  private nextGenerationTimerId: number;

  public readonly onStart: EventEmitter;
  public readonly onStop: EventEmitter;
  public readonly onReset: EventEmitter;
  public readonly onSpeedChanged: EventEmitter<number>;
  public readonly onGridChanged: EventEmitter<OnGridChangedEvent>;
  public readonly onCellChanged: EventEmitter<Cell>;
  public readonly onNewGeneration: EventEmitter<OnNewGenerationEvent>;

  constructor(size?: number) {
    this.size = size ?? Game.DefaultSize;
    this.speed = Game.MinSpeed;

    this.cells = this.initCells();
    this.isRunning = false;
    this.nextGenerationTimerId = -1;
    this.generationNumber = 0;

    this.onStart = new EventEmitter();
    this.onStop = new EventEmitter();
    this.onReset = new EventEmitter();
    this.onSpeedChanged = new EventEmitter<number>();
    this.onGridChanged = new EventEmitter<OnGridChangedEvent>();
    this.onCellChanged = new EventEmitter<Cell>();
    this.onNewGeneration = new EventEmitter<OnNewGenerationEvent>();
  }

  /**
   * Start the game.
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    this.onStart.emit();

    this.nextGeneration();
  }

  /**
   * Stop the game.
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.nextGenerationTimerId >= 0) {
      clearTimeout(this.nextGenerationTimerId);
    }

    this.onStop.emit();
  }

  /**
   * Reset the game.
   */
  public reset(size?: number): void {
    if (this.isRunning) {
      return;
    }

    if (size && (size < Game.MinSize || size > Game.MaxSize)) {
      throw new Error(
        `Game size must remain between ${Game.MinSize} and ${Game.MaxSize}`
      );
    }

    this.size = size ?? this.size;
    this.cells = this.initCells();
    this.generationNumber = 0;

    this.onReset.emit();

    this.onGridChanged.emit({
      cells: this.cells,
      size: this.size,
    });
  }

  /**
   * Randomize the game grid, each cell as a 50% chance to be alive.
   */
  public randomize(): void {
    if (this.isRunning) {
      return;
    }

    this.cells.forEach((cell) => {
      cell.isAlive = Math.random() > 0.5;
    });

    this.onGridChanged.emit({
      cells: this.cells,
      size: this.size,
    });
  }

  /**
   * Toggle a cell at a given position.
   */
  public toggleCell(line: number, column: number): void {
    if (this.isRunning) {
      return;
    }

    if (!this.isValidPosition(line, column)) {
      return;
    }

    const cell = this.getCell(line, column);

    cell.isAlive = !cell.isAlive;

    this.onCellChanged.emit(cell);
  }

  /**
   * Change the speed (time between generations).
   */
  public changeSpeed(newSpeed: number): void {
    if (newSpeed < Game.MinSpeed || newSpeed > Game.MaxSpeed) {
      throw new Error(
        `Game speed must remain between ${Game.MinSpeed} and ${Game.MaxSpeed}`
      );
    }

    this.speed = newSpeed;

    this.onSpeedChanged.emit(this.speed);
  }

  /**
   * Export the current grid state in JSON format.
   */
  public exportToJson(): string {
    return JSON.stringify({
      size: this.size,
      cells: this.cells,
    });
  }

  /**
   * Load grid from JSON content.
   */
  public loadFromJson(json: string): void {
    if (this.isRunning) {
      return;
    }

    const data = JSON.parse(json);

    if (!('cells' in data && 'size' in data)) {
      throw new Error('Invalid JSON file');
    }

    this.size = data.size;
    this.cells = data.cells;
    this.generationNumber = 0;

    this.onReset.emit();

    this.onGridChanged.emit({
      cells: this.cells,
      size: this.size,
    });
  }

  /**
   * Returns a boolean indicating if the given position is valid in the game gris.
   */
  public isValidPosition(line: number, column: number): boolean {
    return line >= 0 && column >= 0 && line < this.size && column < this.size;
  }

  /**
   * Returns the cell at a given position (line/column)
   */
  public getCell(line: number, column: number): Cell {
    return this.cells[this.size * line + column];
  }

  /**
   * Returns the array of cells composing the game grid.
   */
  public getCells(): Cell[] {
    return this.cells;
  }

  /**
   * Returns the current game's grid size.
   */
  public getSize(): number {
    return this.size;
  }

  /**
   * Returns the current game speed.
   */
  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Returns true if the game is currently running.
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Returns the current generatino number.
   */
  public getGenerationNumber(): number {
    return this.generationNumber;
  }

  /**
   * Returns a new array of cells of the current game size.
   */
  private initCells(): Cell[] {
    const cells = new Array<Cell>();

    for (let id = 0; id < this.size * this.size; ++id) {
      cells.push({
        id,
        column: id % this.size,
        line: Math.trunc(id / this.size),
        isAlive: false,
      });
    }

    return cells;
  }

  /**
   * Compute the number of alive neighbours for a given cell.
   */
  private countAliveNeighbours(cell: Cell): number {
    return Game.NeighbourOffsets.reduce<number>(
      (count, [lineOffset, columnOffset]) => {
        const line = cell.line + lineOffset;
        const column = cell.column + columnOffset;

        if (this.isValidPosition(line, column)) {
          const neighbourCell = this.getCell(line, column);

          if (neighbourCell.isAlive) {
            return count + 1;
          }
        }

        return count;
      },
      0
    );
  }

  /**
   * Compute the next generation, and schedule the next call based on the current speed.
   */
  private nextGeneration(): void {
    this.nextGenerationTimerId = -1;
    this.generationNumber += 1;

    const bornCells = new Array<Cell>();
    const killedCells = new Array<Cell>();

    this.cells = this.cells.map((cell) => {
      const aliveNeighboursCount = this.countAliveNeighbours(cell);

      if (cell.isAlive) {
        if (aliveNeighboursCount < 2 || aliveNeighboursCount > 3) {
          const killedCell: Cell = {
            ...cell,
            isAlive: false,
          };

          killedCells.push(killedCell);

          return killedCell;
        }
      } else {
        if (aliveNeighboursCount === 3) {
          const bornCell: Cell = {
            ...cell,
            isAlive: true,
          };

          bornCells.push(bornCell);

          return bornCell;
        }
      }

      return cell;
    });

    this.onNewGeneration.emit({
      bornCells,
      killedCells,
      generationNumber: this.generationNumber,
    });

    this.nextGenerationTimerId = setTimeout(() => {
      this.nextGeneration();
    }, 1000 * (1.0 / this.speed));
  }
}
