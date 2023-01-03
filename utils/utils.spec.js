import { ROCK, SCISSORS, PAPER, TIE } from "../constants/constants.js";
import { getGameWinner, getRoundWinner, notifyPlayers } from "./utils.js";
import { getUpdateEvent } from "../constants/events.js";

test("getGameWinner", () => {
  let game = {
    players: [{ nickname: "user1" }, { nickname: "user2" }],
    rounds: [{ winner: "user1" }, { winner: "user2" }, { winner: "user1" }],
  };
  expect(getGameWinner(game)).toBe("user1");

  game = {
    players: [{ nickname: "user1" }, { nickname: "user2" }],
    rounds: [
      { winner: "user1" },
      { winner: "user2" },
      { winner: "user1" },
      { winner: "user2" },
    ],
  };
  expect(getGameWinner(game)).toBe(null);
});

test("getRoundWinner", () => {
  expect(
    getRoundWinner([
      { nickname: "user1", action: ROCK },
      { nickname: "user2", action: PAPER },
    ])
  ).toBe("user2");

  expect(
    getRoundWinner([
      { nickname: "user1", action: SCISSORS },
      { nickname: "user2", action: ROCK },
    ])
  ).toBe("user2");

  expect(
    getRoundWinner([
      { nickname: "user1", action: SCISSORS },
      { nickname: "user2", action: PAPER },
    ])
  ).toBe("user1");

  expect(
    getRoundWinner([
      { nickname: "user1", action: ROCK },
      { nickname: "user2", action: ROCK },
    ])
  ).toBe(TIE);

  expect(
    getRoundWinner([
      { nickname: "user1", action: SCISSORS },
      { nickname: "user2", action: SCISSORS },
    ])
  ).toBe(TIE);

  expect(
    getRoundWinner([
      { nickname: "user1", action: PAPER },
      { nickname: "user2", action: PAPER },
    ])
  ).toBe(TIE);
});

test("notifyPlayers", () => {
  const connectionMock = {
    send: (message) => {},
  };
  const players = [{ nickname: "user1" }, { nickname: "user2" }];
  const connections = { user1: connectionMock, user2: connectionMock };
  const loggerMock = {
    info: () => {},
  };
  const sendSpy = jest.spyOn(connectionMock, "send");
  const updateEvent = getUpdateEvent();

  notifyPlayers(players, connections, loggerMock);
  expect(sendSpy).toHaveBeenCalledWith(updateEvent);
});
