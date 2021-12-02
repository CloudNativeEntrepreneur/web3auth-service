#!/bin/sh

export PG_PORT="5434"
export PG_PASS=$(kubectl get secret web3auth.web3auth-db-postgresql.credentials.postgresql.acid.zalan.do -o jsonpath={.data.password} | base64 -D)
npm run dev