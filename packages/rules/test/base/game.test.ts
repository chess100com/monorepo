import { assert, describe, it } from "vitest"
import type { GameMetaData } from "../../src/Game";
import { Game } from "../../src/Game"
import { StartFen } from "../../src/Shared";

describe("Game", () => {

  it("Empty game", () => {
    const game = Game.create()
    assert.equal(game.event, "");
    assert.equal(game.site, "");
    assert.equal(game.date, "");
    assert.equal(game.round, "");
    assert.equal(game.white, "");
    assert.equal(game.black, "");
    assert.equal(game.result, "*");
    assert.equal(game.fromPosition, false);
    assert.equal(game.startPosition, null);
    assert.equal(game.moves.length, 0);
  });

  it("With metadata", () => {
    const game = Game.create({
      black: '1',
      date: '2',
      event: '3',
      round: '4',
      site: '5',
      white: '6',
    });
    assert.equal(game.black, '1');
    assert.equal(game.date, '2');
    assert.equal(game.event, '3');
    assert.equal(game.round, '4');
    assert.equal(game.site, '5');
    assert.equal(game.white, '6');
  });

  it("Omit metadata", () => {
    const metadata: GameMetaData = {
      black: '1',
      date: '2',
      event: '3',
      round: '4',
      site: '5',
      white: '6',
    }
    const keys = Object.keys(metadata) as (keyof GameMetaData)[];
    const emptyGame = Game.create();
    for (const omitKey of keys) {
      const newMetadata: GameMetaData = {};
      for (const key of keys) {
        if (key === omitKey) continue;
        newMetadata[key] = metadata[key]
      }
      const game = Game.create(newMetadata);
      for (const key of keys) {
        if (key === omitKey) {
          assert.equal(game[key], emptyGame[key]);
        } else {
          assert.equal(game[key], metadata[key]);
        }
      }
    }
    const game = Game.create({
      black: '1',
      date: '2',
      event: '3',
      round: '4',
      site: '5',
      white: '6',
    });
    assert.equal(game.black, '1');
    assert.equal(game.date, '2');
    assert.equal(game.event, '3');
    assert.equal(game.round, '4');
    assert.equal(game.site, '5');
    assert.equal(game.white, '6');
  });

  it("Base illegal move", () => {
    const game = Game.create();
    assert.throw(
      () => game.move({ x: 1, y: 1 }, { x: 1, y: 10 }),
      `Illegal move a1->a10 in position ${StartFen}`,
    );
  });


});


