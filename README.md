# radicle-mirroring
This script can be used to mirror an organization's Github repositories on the Radicle network.

It uses the Github GraphQL api to query an org's repos, then pulls each repo, initialized each repo on Radicle, then pushes code to a Radicle seed node. 
