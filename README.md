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
npm run dev
```

# FAQ

## YOUR SECRET IS EXPOSED

Yes, I know.

It'll only work in the local development cluster - this is part of an example that contains several moving parts, so I just generated some random secrets where they were needed and preconfigured things accordingly so you can just run it locally and everything will work. Couldn't go without secrets as part of that example is an authentication server and it's JWT integration with Hasura.

Don't use these proconfigured values in production. I typically use ExternalSecrets in prod.
