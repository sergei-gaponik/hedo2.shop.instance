import { updateAllProducts } from '../api/updateProducts'
import { InstanceResponse } from '../types';

async function getProducts() {
  
}

async function updateProducts(args) {

  const { filter } = args;
  let res: InstanceResponse;

  if (filter) {
    
  }
  else {
    res = await updateAllProducts()
  }

  return res;
}


export default {
  getProducts,
  updateProducts
}