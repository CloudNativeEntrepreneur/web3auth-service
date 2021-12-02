# web3auth-service

## Running Locally

### Install

```
npm ci
```

### Develop

#### Postgres

Web3 Auth service uses a PSQL db. It is configured to connect to one provided in the `docker-compose.yml` file.

To start postgres with Docker, run:

```
make up
```

#### With VSCode Debugger

To run the project with VSCode's integrated debugger, click the icon with a play button and bug on it, then click "Debug".

#### In a Terminal

If you don't want to use the VSCode debugger, you can also run:

```
make dev-docker-compose
```

#### Against web3auth-db running in local-dev-cluster

https://github.com/CloudNativeEntrepreneur/web3auth-db

```
make dev
```

# FAQ

## YOUR SECRET IS EXPOSED

Yes, I know.

It'll only work in the local development cluster - this is part of [an example](https://github.com/CloudNativeEntrepreneur/web3auth-meta) that contains several moving parts, so I just generated some random secrets where they were needed and preconfigured things accordingly so you can just run it locally and everything will work. Couldn't go without secrets as part of that example is an authentication server and it's JWT integration with Hasura.

Don't use these proconfigured values in production. I typically use ExternalSecrets in prod.

## How to use this project in production?

This project is early on - it's basically a single client to provide auth, compared to something like Keycloak that has multiple clients within multiple realms. That said, the single client is good to go and that's good enough for many projects.

When it's more fully featured, such as the ability to configure custom claims mappers for tokens, it could probably be consumed as a generic helm chart - but for now, I suggest using this repo as a template and importing it into your own architecture so you can change the claims mapped in the code, and be able to get updates to the code.

Using the template function through github would make getting updates hard, so instead, fork this repo, and clone down your fork. Then add this repo as a "remote" so you can pull updates from it like:

```
git remote add source git@github.com:CloudNativeEntrepreneur/web3auth-service.git
git fetch --all
git rebase source/master --autostash
```

Feel free to make PRs back with generic improvements!
