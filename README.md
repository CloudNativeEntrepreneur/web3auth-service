# web3-auth-service

## Running Locally

### Install

Some small tweaks are made for this backend to work on Heroku:

- the `tsconfig.json` could have extended the root one, but doesn't.
- a `heroku` script has been added in `package.json`, that's the command Heroku uses to run the web server, as defined in the Procfile.
- the web server listens on the `$PORT` environment variable, which has been added in `src/index.ts`.
