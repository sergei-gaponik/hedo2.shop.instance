import { gqlHandler } from "@sergei-gaponik/hedo2.lib.util";

export async function createUser(user) {
  const createUser = `
    mutation CreateUser($input: UserInput!){
      createUser(input: $input){
        errors
      }
    }
  `;

  const r2 = await gqlHandler({
    query: createUser,
    variables: {
      input: {
        username: user.sub,
      },
    },
  });
}
