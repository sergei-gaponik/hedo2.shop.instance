require("module-alias/register")
require("reflect-metadata")
require("dotenv").config()

import { bold, cyan, yellow } from 'colors/safe'
import * as fs from 'fs'
import * as path from 'path'
import { MongoClient } from 'mongodb'
import Fastify from 'fastify'
import handler from './core/handler'
import systemHandler from './core/systemHandler'
import { VERSION, PRODUCTION } from './core/const'
import { setContext } from './core/context'

async function main() {


  console.log(`${bold('INSTANCE API')} v${VERSION}\n`);
  console.log(`env: ${PRODUCTION ? bold(cyan("PRODUCTION")) : bold(yellow("DEVELOPMENT"))}`);

  const { PORT, HOST, MONGODB_INSTANCE, SYSTEM_API_ENDPOINT } = process.env;
  
  console.log('connecting to mongo db...');

  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }

  const mongoDB = await MongoClient.connect(MONGODB_INSTANCE, mongoOptions)
    .then(client => client.db());

  console.log('initializing graphql client');

  setContext({ mongoDB })

  console.log('initializing server...');

  const app = Fastify({
    https: {
      key: fs.readFileSync(path.join(__dirname, '../.ssl/key.pem')),
      cert: fs.readFileSync(path.join(__dirname, '../.ssl/cert.pem'))
    }
  })

  app.register(require('fastify-cors'), { origin: "*" })
  app.register(require('fastify-compress'))

  app.post('/api', (req, res) => handler(req, res));
  app.post('/system', (req, res) => systemHandler(req, res));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\napp running on ${cyan(`https://${HOST}:${PORT}`)}`);
    console.log(`api endpoint ${cyan(`https://${HOST}:${PORT}/api`)}`);
    console.log(`system endpoint ${cyan(`https://${HOST}:${PORT}/system`)}\n`);
  })

}

main()