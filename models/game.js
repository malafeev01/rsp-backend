import mongoose from "mongoose";

export const GAME_IN_PROGRESS = "in-progress";
export const GAME_FINISHED = "finished";

const gameSchema = mongoose.Schema({
  max_rounds: {
    type: Number,
    required: true,
  },
  players: {
    type: [{ nickname: String }],
    required: true,
  },
  current_round: {
    type: Number,
    required: true,
  },
  rounds: {
    type: [
      {
        actions: {
          type: [{ nickname: String, action: String }],
        },
        winner: String,
      },
    ],
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
});

export const Game = mongoose.model("Game", gameSchema);
