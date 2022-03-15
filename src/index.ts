import { request, gql, GraphQLClient } from "graphql-request";
import { GITHUB_API_KEY } from "./API_KEYS";

const mirror = async () => {
  const query = gql`
    {
      organization(login: "ethereum") {
        id
        repositories(
          first: 100
          orderBy: { field: PUSHED_AT, direction: DESC }
        ) {
          edges {
            node {
              id
              name
              projectsUrl
            }
          }
        }
      }
    }
  `;
  const endpoint = "https://api.github.com/graphql";

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: "Bearer " + GITHUB_API_KEY,
    },
  });

  const data = await graphQLClient.request(query);
  console.log(JSON.stringify(data, undefined, 2));
};

mirror().catch((error) => console.error(error));
