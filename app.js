import express from "express";
import winston from "winston";
import { WebSocketServer } from "ws";
import fs from "fs";

import { Game, GAME_IN_PROGRESS, GAME_FINISHED } from "./models/game.js";
import { Stat } from "./models/stat.js";
import { ROCK, PAPER, SCISSORS, TIE } from "./constants/constants.js";
import { CONNECTED, getErrorEvent } from "./constants/events.js";
import { LOGGER_FORMAT } from "./constants/logger.js";
import { getGameWinner, getRoundWinner, notifyPlayers } from "./utils/utils.js";

//Reading config file
export const CONFIG = JSON.parse(fs.readFileSync("./env.json", "utf8"));

//Initializing the logging system
export const logger = winston.createLogger({
  level: "debug",
  format: LOGGER_FORMAT,
  transports: [new winston.transports.File({ filename: CONFIG.LOG_FILE_NAME })],
});

logger.info("RSP server is starting");

//Configuring Express server
export const app = express();
app.use(express.json());

function logRequest(req, res, next) {
  logger.info(`[${req.method}] ${req.url}. Body: ${JSON.stringify(req.body)}`);
  next();
}
app.use(logRequest);

//Starting WebSockets server
export const webSocketServer = new WebSocketServer({
  port: CONFIG.WS_SERVER_PORT,
});

// This is in-memory structure for storing WebSocket connections
const CONNECTIONS = {};

webSocketServer.on("connection", (ws) => {
  ws.on("message", (m) => {
    const msg = JSON.parse(m);
    if (msg.action === "add") {
      logger.info(
        "[ws] Adding a new connection for user with nickname: " + msg.nickname
      );
      CONNECTIONS[msg.nickname] = ws;
    }
  });

  ws.on("error", (e) => {
    logger.info(
      "[ws] Adding a new connection for user with nickname: " + msg.nickname
    );
    ws.send(JSON.stringify(getErrorEvent(err)));
  });

  logger.info("[ws] New connection established");
  ws.send(JSON.stringify(CONNECTED));
});

app.post("/api/game", (req, res) => {
  const maxRounds = req.body.max_rounds;
  const nickname = req.body.nickname;

  if (!maxRounds || parseInt(maxRounds) <= 0 || parseInt(maxRounds) > 10) {
    return res.status(400).send({
      code: 400,
      error: 'Please specify valid "max_rounds" parameter',
    });
  }

  if (!nickname) {
    return res
      .status(400)
      .send({ code: 400, error: 'Please specify "nickname" parameter' });
  }

  const game = new Game({
    max_rounds: maxRounds,
    players: [{ nickname: nickname }],
    current_round: 0,
    rounds: [],
    state: GAME_IN_PROGRESS,
  });

  game.save().then((value) => {
    logger.info(`A new game has been created: ${game}`);
    return res.send({ game_id: value.id });
  });
});

app.get("/api/game/:gameId", (req, res) => {
  const gameId = req.params.gameId;
  Game.findById(gameId).then((game) => {
    if (!game) {
      return res
        .status(404)
        .send({ code: 404, error: `Game with id "${gameId}" doesn\'t exist` });
    }

    // Do not show the last round result if it's not finished to avoid game cheating
    if (game.rounds.length > 0 && !game.rounds[game.rounds.length - 1].winner) {
      game.rounds[game.rounds.length - 1].actions = [];
    }
    return res.send(game);
  });
});

app.post("/api/game/:gameId/join", (req, res) => {
  const gameId = req.params.gameId;
  Game.findById(gameId).then((game) => {
    if (!game) {
      return res
        .status(404)
        .send({ code: 404, error: `Game with id "${gameId}" doesn\'t exist` });
    }
    if (game.state === GAME_FINISHED) {
      return res
        .status(400)
        .send({ code: 400, error: `Game with id "${gameId}" is finished` });
    }
    const nickname = req.body.nickname;
    if (!nickname) {
      return res
        .status(400)
        .send({ code: 400, error: 'Please specify "nickname" parameter' });
    }
    const player = game.players.find((player) => player.nickname === nickname);
    if (game.players.length > 1) {
      if (!player) {
        return res.status(400).send({
          code: 400,
          error: `This game is full, please choose from existent players: ${game.players.map(
            (player) => player.nickname
          )}`,
        });
      } else {
        logger.info(
          `Player '${nickname} has been already added to the game ${gameId}'`
        );
        return res.send({});
      }
    } else {
      if (!game.players.find((player) => player.nickname === nickname)) {
        game.players.push({ nickname: nickname });
        game.save().then(() => {
          logger.info(
            `Player '${nickname} has been added to the game ${gameId}'`
          );

          // Send WS message to each player to notify them to update their screens.
          notifyPlayers(game.players, CONNECTIONS, logger);
        });
      }

      res.send({});
    }
  });
});

app.post("/api/game/:gameId/action", (req, res) => {
  const gameId = req.params.gameId;
  Game.findById(gameId).then((game) => {
    if (!game) {
      return res
        .status(404)
        .send({ code: 404, error: `Game with id "${gameId}" doesn\'t exist` });
    }

    const nickname = req.body.nickname;
    const action = req.body.action;
    if (!nickname) {
      return res
        .status(400)
        .send({ code: 400, error: 'Please specify "nickname" parameter' });
    }

    if (!action || ![ROCK, PAPER, SCISSORS].includes(action)) {
      return res
        .status(400)
        .send({ code: 400, error: 'Please specify valid "action" parameter' });
    }

    if (game.state === GAME_FINISHED) {
      return res
        .status(400)
        .send({ code: 400, error: `Game with id "${gameId}" is finished` });
    }

    const currentRound = game.current_round;

    logger.info(
      `Current round: ${currentRound}. Nickname: ${nickname}. Action: ${action}`
    );
    // Check wheather object of current round is created or not
    // If it's not created just push a round object with aciton to game.rounds list.
    if (game.rounds.length - 1 < currentRound) {
      game.rounds.push({
        actions: [{ nickname: nickname, action: action }],
        winner: "",
      });
      logger.info(
        `Round object is not created. Lets create it: ${game.rounds}`
      );
    } else {
      // If it's already created, just push the action and determine the winner.
      if (
        game.rounds[currentRound].actions.find(
          (action) => action.nickname === nickname
        )
      ) {
        return res.status(400).send({
          code: 400,
          error: "You've already set the action in this round",
        });
      }
      game.rounds[currentRound].actions.push({
        nickname: nickname,
        action: action,
      });
      const roundWinner = getRoundWinner(game.rounds[currentRound].actions);
      game.rounds[currentRound].winner = roundWinner;

      if (roundWinner !== TIE) {
        // Update statistics collections
        Stat.findOne({ nickname: roundWinner }, (err, stat) => {
          if (!stat) {
            Stat.create({ nickname: roundWinner, win_rounds: 1 });
          } else {
            stat.win_rounds += 1;
            stat.save();
          }
        });
      }

      // Increment current round or finish the game
      logger.info(
        `Current round: ${currentRound}. Winner: ${game.rounds[currentRound].winner}`
      );
      if (game.current_round < game.max_rounds - 1) {
        game.current_round = game.current_round + 1;
        logger.info(
          `Increment current round in the game ${gameId}. Current round will be ${game.current_round}`
        );
      } else {
        logger.info(`It was the last round. Finish the game ${gameId}`);
        game.state = GAME_FINISHED;

        // Update statistics collections
        const gameWinner = getGameWinner(game);
        if (gameWinner) {
          Stat.findOne({ nickname: gameWinner }, (err, stat) => {
            if (stat) {
              stat.win_games += 1;
              stat.save();
            }
          });
        }
      }
    }
    game.save().then(() => {
      // Send WS message to each player to notify them to update their screens.
      notifyPlayers(game.players, CONNECTIONS, logger);

      return res.send({});
    });
  });
});

app.get("/api/stat", (req, res) => {
  Stat.find({}, {}, { sort: { win_games: "desc" }, limit: 10 }, (err, stat) => {
    return res.send(stat);
  });
});
