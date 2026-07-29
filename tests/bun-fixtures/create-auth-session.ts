import { appInstance } from "../../packages/auth/src/server/index";

const [username, password] = Bun.argv.slice(2);
if (!username || !password) {
  throw new Error("Usage: create-auth-session.ts <username> <password>");
}

const { headers } = await appInstance.api.signInUsername({
  body: { username, password },
  returnHeaders: true,
});
const cookies = headers.getSetCookie().map((value) => value.split(";", 1)[0]);

if (cookies.length === 0) throw new Error("Better Auth did not return a session cookie");
console.log(JSON.stringify({ cookie: cookies.join("; ") }));
