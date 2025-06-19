import { it, expect, describe, vi, beforeEach } from 'vitest';
import { Game } from '../game';

describe('given a 3x3 game', () => {
  const size = 3;
  const game = new Game(3);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should be correctly initialized', () => {
    expect(game.getSize()).toEqual(size);
    expect(game.getSpeed()).toEqual(Game.DefaultSpeed);
    expect(game.getIsRunning()).toEqual(false);
    expect(game.getGenerationNumber()).toEqual(0);

    expect(game.getCells().map((cell) => cell.id)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(game.getCells().map((cell) => cell.line)).toEqual([
      0, 0, 0, 1, 1, 1, 2, 2, 2,
    ]);
    expect(game.getCells().map((cell) => cell.column)).toEqual([
      0, 1, 2, 0, 1, 2, 0, 1, 2,
    ]);
    expect(game.getCells().map((cell) => cell.isAlive)).toEqual(
      new Array<boolean>(9).fill(false)
    );
  });

  it.each([
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ])('[%d,%d] should be a valid position', (line, column) => {
    expect(game.isValidPosition(line, column)).toEqual(true);
  });

  it.each([
    [-1, 0],
    [5, 1],
    [0, 4],
    [1, -2],
  ])('[%d,%d] should be an invalid position', (line, column) => {
    expect(game.isValidPosition(line, column)).toEqual(false);
  });

  it('should toggle cell', () => {
    game.toggleCell(2, 2);
    expect(game.getCell(2, 2).isAlive).toEqual(true);

    game.toggleCell(2, 2);
    expect(game.getCell(2, 2).isAlive).toEqual(false);
  });

  it('should compute the correct amount of alive neighbours', () => {
    game.toggleCell(0, 0);
    game.toggleCell(0, 1);
    game.toggleCell(2, 2);

    expect(game['countAliveNeighbours'](game.getCell(0, 2))).toEqual(1);
    expect(game['countAliveNeighbours'](game.getCell(1, 0))).toEqual(2);
    expect(game['countAliveNeighbours'](game.getCell(1, 1))).toEqual(3);

    game.toggleCell(0, 0);
    game.toggleCell(0, 1);
    game.toggleCell(2, 2);
  });

  it('should compute the correct next generation', () => {
    game.toggleCell(0, 0);
    game.toggleCell(0, 2);
    game.toggleCell(1, 2);

    game['nextGeneration']();

    expect(game.getGenerationNumber()).toEqual(1);
    expect(game.getCells().map((cell) => cell.isAlive)).toEqual([
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it('should reset the game with a new size', () => {
    game.reset(2);

    expect(game.getSize()).toEqual(2);
    expect(game.getCells().map((cell) => cell.id)).toEqual([0, 1, 2, 3]);
    expect(game.getCells().map((cell) => cell.line)).toEqual([0, 0, 1, 1]);
    expect(game.getCells().map((cell) => cell.column)).toEqual([0, 1, 0, 1]);
    expect(game.getCells().map((cell) => cell.isAlive)).toEqual(
      new Array<boolean>(4).fill(false)
    );
  });
});
