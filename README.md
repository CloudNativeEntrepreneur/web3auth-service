# web3-auth-service

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
