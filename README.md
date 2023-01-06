# Rock, Scissors, Paper backend.

[![deploy](https://github.com/malafeev01/rsp-backend/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/malafeev01/rsp-backend/actions/workflows/deploy.yml)

This is a backend for Rock, Scissors, Paper game.
It uses express.js framework, MongoDB for storing data, Winston for logging.

## Installation

To install the application dependencies simply do

```
npm install
```

Then create env.json file with configuration in the root of the app. Please see env_sample.json to understand what fields should be determined.

## Starting

To start the application please use following command:

```
npm start
```

## Testing

To start tests please use following command:

```
npm test
```

## Useful commands

Format code with prettier:

```
npm run format
```

# API specification

## GET /api/game/:gameId

Get a game object.

Payload: None
Return object:

```
{
  max_rounds: number,
  players: [{ nickname: string }, ...],
  current_round: number,
  rounds: [
    {
      actions: [{ nickname: string, action: string }, ...],
      winner: string,
    },
  ],
  state: string,
}
```

## POST /api/game

Create a new game.

Payload: {nickname: string, max_rounds: string}
Return object: {}

## POST /api/game/:gameId/join

Join to the game.

Payload: {nickname: string}
Return object: {}

## POST /api/game/:gameId/action

Make an action on the game.

Payload: {nickname: string, action: string}
Return object: {}

## GET /api/stat

Get statistics.

Payload: None
Return object:

```
{[
  nickname: string,
  win_rounds: number,
  win_games: numer,
]}
```
