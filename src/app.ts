require("reflect-metadata");

import { PRODUCTION, VERSION } from "./core/const";

if (!PRODUCTION) {
  require("dotenv").config();
  // require("module-alias/register")
}

import { bold, cyan, yellow } from "colors/safe";
import * as fs from "fs";
import * as path from "path";
import { MongoClient } from "mongodb";
import Fastify from "fastify";
import handler from "./core/handler";
import systemHandler from "./core/systemHandler";
import { setContext } from "./core/context";
import * as paypal from "@paypal/checkout-server-sdk";
import { initConsole } from "@sergei-gaponik/hedo2.lib.util";

async function main() {
  initConsole(console);

  console.log(`${bold("INSTANCE API")} v${VERSION}\n`);
  console.log(
    `env: ${
      PRODUCTION ? bold(cyan("PRODUCTION")) : bold(yellow("DEVELOPMENT"))
    }`
  );

  const { PORT, HOST, MONGODB_INSTANCE } = process.env;

  console.log("connecting to mongo db...");

  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  const mongoDB = await MongoClient.connect(
    MONGODB_INSTANCE,
    mongoOptions
  ).then((client) => client.db());

  console.log("initializing paypal client...");

  const Environment = PRODUCTION
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;
  const paypalClient = new paypal.core.PayPalHttpClient(
    new Environment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    )
  );

  setContext({ mongoDB, paypalClient });

  console.log("initializing server...");

  // const app = Fastify({
  //   https: {
  //     key: fs.readFileSync(path.join(__dirname, '../.ssl/key.pem')),
  //     cert: fs.readFileSync(path.join(__dirname, '../.ssl/cert.pem'))
  //   }
  // })

  const app = Fastify();

  app.register(require("fastify-cors"), { origin: "*" });
  app.register(require("fastify-compress"));
  app.register(require("fastify-cookie"), {
    secret: process.env.COOKIE_SIGNATURE,
  });

  app.post("/api", (req, res) => handler(req, res));
  app.post("/system", (req, res) => systemHandler(req, res));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`app running on ${cyan(`http://${HOST}:${PORT}`)}`);
    console.log(`api endpoint ${cyan(`http://${HOST}:${PORT}/api`)}`);
    console.log(`system endpoint ${cyan(`http://${HOST}:${PORT}/system`)}\n`);
  });
}

main();
