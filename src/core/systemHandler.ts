import { FastifyRequest, FastifyReply } from 'fastify'
import { InstanceRequest, InstanceRequestError, InstanceResponse } from '../types'
import systemRoutes from './systemRoutes'


export default async function systemHandler(req: FastifyRequest, reply: FastifyReply) {
  
  const _r = await (async (): Promise<InstanceResponse> => {
    
    if(!req.headers["content-type"]?.includes("application/json"))
      return { errors: [ InstanceRequestError.wrongContentType ] };
    
    if(req.headers["authorization"] != `Bearer ${process.env.SECRET_KEY}`)
      return { errors: [ InstanceRequestError.permissionDenied ]}

    const body: InstanceRequest = req.body;

    try{

      let args: any = body.args || {}

      if(!systemRoutes.hasOwnProperty(body.path))
        return { errors: [ InstanceRequestError.pathNotFound ] };

      return await systemRoutes[body.path](args);
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