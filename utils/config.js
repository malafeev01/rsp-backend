import fs from "fs";

export default class Config {
  config = {};

  constructor() {
    this.config = JSON.parse(fs.readFileSync("./env.json", "utf8"));
  }

  get(param) {
    if (param in process.env) {
      return process.env[param];
    } else {
      return this.config[param];
    }
  }
}
