
import Joi = require('joi');
import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';

export async function getFrontPageSections(args): Promise<InstanceResponse> {


  const priority = parseInt(args.priority) || 0

  const frontPageSections = await context().mongoDB.collection('frontPageSections').find({
    priority: { $gte: priority }
  }).toArray()

  return {
    data: { frontPageSections }
  }
}
