import mongoose from "mongoose";

const statSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
  },
  win_rounds: {
    type: Number,
    required: true,
    default: 0,
  },
  win_games: {
    type: Number,
    required: true,
    default: 0,
  },
});

export const Stat = mongoose.model("Stat", statSchema);
