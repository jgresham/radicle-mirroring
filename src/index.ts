import { request, gql, GraphQLClient } from "graphql-request";
import { GITHUB_API_KEY } from "./API_KEYS";
const { execSync } = require("child_process");

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

  const excludeNames = ["solc-bin", "discv4-dns-lists"];
  for (let i = 0; i < data.organization.repositories.edges.length; i++) {
    console.log("Mirroring repo #" + i + "...");
    const repo = data.organization.repositories.edges[i].node;
    const node = data.organization.repositories.nodes[i];
    if (excludeNames.includes(repo.name)) {
      console.log("Skipping excluded repo " + repo.name);
    } else {
      mirrorRepo(repo, node);
    }
  }
};

const mirrorRepo = (repo, node) => {
  console.log("mirror repo, node", repo, node);

  // check if repo has already been pulled
  try {
    console.log("Pulling any new code...");
    const result = execSync(`cd ${repo.name} && git pull`);
    console.log("result of cd: ", result);
  } catch (error) {
    console.error("error in exec sync", error);
    // clone repo, then cd
    cloneRepo(repo);
    const result = execSync(`cd ${repo.name}`);
    console.log("result of cd: ", result);
  }

  // run rad init with args
  try {
    console.log("Initializing the Radicle project... ");
    const result = execSync(
      `cd ${repo.name} && rad init --name ${repo.name} --description "${node.description}" --branch "${node.defaultBranchRef.name}"`
    );
    console.log("result of rad init: ", result);
  } catch (error) {
    console.error("error in rad init", error);
  }

  // run rad push
  try {
    console.log("Pushing the Radicle project to a radicle seed... ");
    const result = execSync(
      `cd ${repo.name} && rad push --seed maple.radicle.garden`
    );
    console.log("result of rad push: ", result);
  } catch (error) {
    console.error("error in rad push", error);
  }
};

const cloneRepo = (repo) => {
  console.log(`Cloning repo ${repo.name}...`);
  try {
    const sshCloneUrl = `git@github.com:ethereum/${repo.name}.git`;
    const result = execSync(`git clone ${sshCloneUrl}`);
    console.log("result of git clone: ", result);
  } catch (error) {
    console.error("error:", error);
  }
  console.log(`Finished cloning repo ${repo.name}`);
};

mirror().catch((error) => console.error(error));
