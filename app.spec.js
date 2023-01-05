import request from "supertest";
import { app, webSocketServer } from "./app";
import { Game, GAME_FINISHED } from "./models/game.js";
import * as mockingoose from "mockingoose";

afterAll(() => {
  webSocketServer.close();
});

describe("Testing RSP endpoints", () => {
  // Testing GET /api/game/:gameId
  test("/api/game/:gameId", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
      rounds: [
        {
          actions: [
            { nickname: "user1", action: "scissors" },
            { nickname: "user2", action: "paper" },
          ],
          winner: "user1",
        },
        { actions: [{ nickname: "user1", action: "scissors" }], winner: "" },
      ],
    });

    request(app)
      .get("/api/game/63b048cade1b0dc478bee034")
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body["_id"]).toBe("63b048cade1b0dc478bee034");
        expect(response.body.rounds[0].actions[0].nickname).toBe("user1");
        expect(response.body.rounds[0].actions[1].nickname).toBe("user2");
        expect(response.body.rounds[1].actions.length).toBe(0);
        done();
      });
  });

  test("/api/game/:gameId - 404", (done) => {
    Game.findById = jest.fn().mockResolvedValue(null);

    request(app)
      .get("/api/game/63b048cade1b0dc478bee034")
      .then((response) => {
        expect(response.statusCode).toBe(404);
        expect(response.body.code).toBe(404);
        expect(response.body.error).toBe(
          'Game with id "63b048cade1b0dc478bee034" doesn\'t exist'
        );
        done();
      });
  });

  // Testing POST /game/
  test("/api/game", (done) => {
    request(app)
      .post("/api/game")
      .send({ nickname: "user1", max_rounds: "5" })
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body.game_id).toBeDefined();
        done();
      });
  });

  test("/api/game - 400 invalid max rounds", (done) => {
    request(app)
      .post("/api/game")
      .send({ nickname: "user1", max_rounds: "11" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe(
          'Please specify valid "max_rounds" parameter'
        );
      });

    request(app)
      .post("/api/game")
      .send({ nickname: "user1" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe(
          'Please specify valid "max_rounds" parameter'
        );
        done();
      });
  });

  test("/api/game - 400 invalid nickname", (done) => {
    request(app)
      .post("/api/game")
      .send({ max_rounds: "5" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe('Please specify "nickname" parameter');
        done();
      });
  });

  // Testing POST /api/game/:gameId/join
  test("/api/game/:gameId/join", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
      players: [],
      save: () => {
        return {
          then: () => {},
        };
      },
    });

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/join")
      .send({ nickname: "user1" })
      .then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });

  test("/api/game/:gameId/join - 400 too many players", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
      players: [{ nickname: "user1" }, { nickname: "user2" }],
    });

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/join")
      .send({ nickname: "user3" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe(
          "This game is full, please choose from existent players: user1,user2"
        );
        done();
      });
  });

  test("/api/game/:gameId/join - 400 game is finished", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
      state: GAME_FINISHED,
    });

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/join")
      .send({ nickname: "user1" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe(
          'Game with id "63b048cade1b0dc478bee034" is finished'
        );
        done();
      });
  });

  test("/api/game/:gameId/join - 400 nickname is not provided", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
    });

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/join")
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe('Please specify "nickname" parameter');
        done();
      });
  });

  test("/api/game/:gameId/join - 404", (done) => {
    Game.findById = jest.fn().mockResolvedValue(null);

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/join")
      .then((response) => {
        expect(response.statusCode).toBe(404);
        expect(response.body.code).toBe(404);
        expect(response.body.error).toBe(
          'Game with id "63b048cade1b0dc478bee034" doesn\'t exist'
        );
        done();
      });
  });

  // Testing POST /api/game/:gameId/action
  test("/api/game/:gameId/action", (done) => {
    const game = new Game({
      _id: "63b048cade1b0dc478bee034",
      players: [],
      rounds: [],
      current_round: 0,
      state: "in-progress",
      max_rounds: 5,
    });
    Game.findById = jest.fn().mockResolvedValue(game);

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/action")
      .send({ nickname: "user1", action: "rock" })
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(game.rounds[0].actions[0].nickname).toBe("user1");
        expect(game.rounds[0].actions[0].action).toBe("rock");
        expect(game.rounds[0].winner).toBe("");
        request(app)
          .post("/api/game/63b048cade1b0dc478bee034/action")
          .send({ nickname: "user2", action: "paper" })
          .then((response) => {
            expect(response.statusCode).toBe(200);
            expect(game.rounds[0].actions[1].nickname).toBe("user2");
            expect(game.rounds[0].actions[1].action).toBe("paper");
            expect(game.rounds[0].winner).toBe("user2");
            done();
          });
      });
  });

  test("/api/game/:gameId/action - 404", (done) => {
    Game.findById = jest.fn().mockResolvedValue(null);
    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/action")
      .send({ nickname: "user1", action: "rock" })
      .then((response) => {
        expect(response.statusCode).toBe(404);
        expect(response.body.code).toBe(404);
        expect(response.body.error).toBe(
          'Game with id "63b048cade1b0dc478bee034" doesn\'t exist'
        );
        done();
      });
  });

  test("/api/game/:gameId/action - 400 nickname is not provided", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
    });
    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/action")
      .send({ action: "rock" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe('Please specify "nickname" parameter');
        done();
      });
  });

  test("/api/game/:gameId/action - 400 action is not provided or invalid", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
    });

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/action")
      .send({ nickname: "user1" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe(
          'Please specify valid "action" parameter'
        );
      });

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/action")
      .send({ nickname: "user1", action: "test" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe(
          'Please specify valid "action" parameter'
        );
        done();
      });
  });

  test("/api/game/:gameId/action - 400 game is finished", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
      state: GAME_FINISHED,
    });

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/action")
      .send({ nickname: "user1", action: "rock" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe(
          'Game with id "63b048cade1b0dc478bee034" is finished'
        );
        done();
      });
  });

  test("/api/game/:gameId/action - 400 action was set already", (done) => {
    Game.findById = jest.fn().mockResolvedValue({
      _id: "63b048cade1b0dc478bee034",
      rounds: [{ actions: [{ nickname: "user1", action: "rock" }] }],
      current_round: 0,
    });

    request(app)
      .post("/api/game/63b048cade1b0dc478bee034/action")
      .send({ nickname: "user1", action: "rock" })
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.error).toBe(
          "You've already set the action in this round"
        );
        done();
      });
  });

  // Testing GET /api/stat
  test("/api/stat", (done) => {
    request(app)
      .get("/api/stat")
      .then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });
});
