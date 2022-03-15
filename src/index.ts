import { request, gql, GraphQLClient } from "graphql-request";
import { GITHUB_API_KEY } from "./API_KEYS";
const { execSync } = require("child_process");

const mirror = async () => {
  const query = gql`
    {
      organization(login: "ethereum") {
        id
        repositories(first: 1, orderBy: { field: PUSHED_AT, direction: DESC }) {
          edges {
            node {
              id
              name
              projectsUrl
            }
          }
          nodes {
            description
            defaultBranchRef {
              name
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

  const repo = data.organization.repositories.edges[0].node;
  const node = data.organization.repositories.nodes[0];
  mirrorRepo(repo, node);
};

const mirrorRepo = (repo, node) => {
  console.log("mirror repo, node", repo, node);

  // check if repo has already been pulled
  try {
    const result = execSync(`cd ${repo.name}`);
    console.log("result of cd: ", result);
  } catch (error) {
    console.error("error in exec sync", error);
    // clone repo, then cd
    cloneRepo(repo);
    const result = execSync(`cd ${repo.name}`);
    console.log("result of cd: ", result);
  }

  // run rad auth with args
  try {
    const result = execSync(`rad init `, [
      "--name",
      repo.name,
      "--description",
      node.description,
      "--branch",
      node.defaultBranchRef.name,
    ]);
    console.log("result of rad init: ", result);
  } catch (error) {
    console.error("error in rad init", error);
  }
};

const cloneRepo = (repo) => {
  try {
    const sshCloneUrl = `git@github.com:ethereum/${repo.name}.git`;
    const result = execSync(`git clone ${sshCloneUrl}`);
    console.log("result of git clone: ", result);
  } catch (error) {
    console.error("error:", error);
  }
};

mirror().catch((error) => console.error(error));
