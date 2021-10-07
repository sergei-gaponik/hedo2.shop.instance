import { FastifyRequest, FastifyReply } from 'fastify'
import { InstanceRequest, InstanceRequestError, InstanceResponse } from '../types'
import routes from './routes'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const _handler = async (body: InstanceRequest): Promise<InstanceResponse> => {

  let args: any = body.args || {}
    
  if(!routes.hasOwnProperty(body.path))
    return { errors: [ InstanceRequestError.pathNotFound ] }

  try{
    return await routes[body.path](args);
  }
  catch(e){
    console.log(e)
    return { errors: [ InstanceRequestError.internalServerError ]};
  }
}

export default async function handler(req: FastifyRequest, reply: FastifyReply) {

  await sleep(200)
  
  const _r = await (async (): Promise<InstanceResponse> => {
    
    if(!req.headers["content-type"]?.includes("application/json"))
      return { errors: [ InstanceRequestError.wrongContentType ] };
    
    const body: InstanceRequest = req.body;

    if(body.bulk){
      
      const r = await Promise.all(body.bulk.map(req => _handler(req)))

      return { bulk: r }
    }
    
    return _handler(body)

  })()

  reply.code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(_r);

}