import { FastifyRequest, FastifyReply } from 'fastify'
import { InstanceRequest, InstanceRequestError, InstanceResponse } from '../types'
import routes from './routes'


export default async function handler(req: FastifyRequest, reply: FastifyReply) {
  
  const _r = await (async (): Promise<InstanceResponse> => {
    
    if(!req.headers["content-type"]?.includes("application/json"))
      return { errors: [ InstanceRequestError.wrongContentType ] };
    
    const body: InstanceRequest = req.body;

    try{
      if(!routes.hasOwnProperty(body.path))
        return { errors: [ InstanceRequestError.pathNotFound ] };

      return await routes[body.path](body.args);
    }
    catch(e){
      console.log(e)
      return { errors: [ InstanceRequestError.internalServerError ] };
    }

  })()


  reply.code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(_r);

}