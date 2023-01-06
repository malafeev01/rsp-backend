import Config from "./config";

test("config test", () => {
  const config = new Config();
  expect(config.get("SERVER_PORT")).toBe(8999);
  process.env.SERVER_PORT = 1234;
  expect(config.get("SERVER_PORT")).toBe("1234");
});
