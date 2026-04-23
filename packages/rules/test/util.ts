import type { CoordinateInterface } from "../src/Shared.js";
import { Utils } from "../src/Utils.js";

export const parseMove = (move: string): [CoordinateInterface, CoordinateInterface] => {
  const [coord1, coord2] = move.split('-');
  return [Utils.parseCoordinate(coord1), Utils.parseCoordinate(coord2)];
}