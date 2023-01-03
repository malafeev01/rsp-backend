import { getUpdateEvent } from "../constants/events.js";
import { ROCK, SCISSORS, PAPER, TIE } from "../constants/constants.js";

/**
 * This function should return a winner of a game.
 * @param game - Game object (see models/game.js)
 * @returns {string} - winner nickname
 */
export function getGameWinner(game) {
  const p1Name = game.players[0].nickname;
  const p2Name = game.players[1].nickname;
  const winCounts = { [p1Name]: 0, [p2Name]: 0 };
  for (let i = 0; i < game.rounds.length; i++) {
    const roundWinner = game.rounds[i].winner;
    winCounts[roundWinner] = winCounts[roundWinner] + 1;
  }
  if (winCounts[p1Name] === winCounts[p2Name]) {
    return null;
  }

  return winCounts[p1Name] > winCounts[p2Name] ? p1Name : p2Name;
}

/**
 * This function should return a winner of a game round.
 * @param actions - actions array like [{ nickname: String, action: String }] (see models/game.js)
 * @returns {string} - winner nickname
 */
export function getRoundWinner(actions) {
  const p1Action = actions[0].action;
  const p2Action = actions[1].action;
  const p1Nickname = actions[0].nickname;
  const p2Nickname = actions[1].nickname;

  if (p1Action === p2Action) {
    return TIE; // no winner case.
  }

  if (p1Action === PAPER) {
    if (p2Action === ROCK) {
      return p1Nickname;
    } else {
      if (p2Action === SCISSORS) {
        return p2Nickname;
      }
    }
  }

  if (p1Action === SCISSORS) {
    if (p2Action === ROCK) {
      return p2Nickname;
    } else {
      if (p2Action === PAPER) {
        return p1Nickname;
      }
    }
  }

  if (p1Action === ROCK) {
    if (p2Action === PAPER) {
      return p2Nickname;
    } else {
      if (p2Action === SCISSORS) {
        return p1Nickname;
      }
    }
  }
}

/**
 * This function should notify users about updates via WebSockets.
 * @param players - Array of the game players (see models/game.js).
 * @param connections - CONNECTIONS in-memory db of WS connections.
 * @param logger - Logger object.
 * @returns {void} - nothing to return.
 */
export function notifyPlayers(players, connections, logger) {
  const updateMessage = getUpdateEvent();
  players.forEach((player) => {
    if (player.nickname in connections) {
      logger.info(`[ws] send message to ${player.nickname}: ${updateMessage}`);
      connections[player.nickname].send(updateMessage);
    }
  });
}
