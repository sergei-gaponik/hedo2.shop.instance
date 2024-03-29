import { FastifyRequest, FastifyReply } from "fastify";
import {
  InstanceRequest,
  InstanceRequestError,
  InstanceResponse,
} from "../types";
import routes from "./routes";
import { performance } from "perf_hooks";
import { crc, sessionHandler } from "@sergei-gaponik/hedo2.lib.util";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const _handler = async (body: InstanceRequest): Promise<InstanceResponse> => {
  let args: any = body.args || {};

  if (!routes.hasOwnProperty(body.path))
    return { errors: [InstanceRequestError.pathNotFound] };

  try {
    return await routes[body.path](args);
  } catch (e) {
    console.log(e);
    return { errors: [InstanceRequestError.internalServerError] };
  }
};

export default async function handler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  await sleep(300);

  const startTime = performance.now();
  const body: InstanceRequest = req.body;
  const sid = sessionHandler(body, process.env.SESSION_SECRET);

  let _r = await (async (): Promise<InstanceResponse> => {
    if (!req.headers["content-type"]?.includes("application/json"))
      return { errors: [InstanceRequestError.wrongContentType] };

    if (body.bulk) {
      let r = [];

      if (body.chronological) {
        for (const task of body.bulk) {
          const _r = await _handler(task);
          r.push(_r);
        }
      } else {
        r = await Promise.all(body.bulk.map((req) => _handler(req)));
      }

      return { bulk: r };
    }

    return _handler(body);
  })();

  const execTime = Math.round((performance.now() - startTime) * 100) / 100;

  let _log: any = {
    path:
      (req.body as any).path ||
      (req.body as any).bulk?.map((a) => a.path) ||
      null,
    execTime,
    sid: sid.value,
    crc: crc(JSON.stringify(req.body)),
  };

  if (_r.errors) _log.errors = _r.errors;

  console.log(_log);

  if (sid.encrypted) {
    _r.sid = sid.encrypted;
    (reply as any).setCookie("sid", sid);
  }

  reply
    .code(200)
    .header("Content-Type", "application/json; charset=utf-8")
    .send(_r);
}
