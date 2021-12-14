#!/bin/sh
export PG_PASS=$(kubectl get secret web3auth.web3auth-db-postgresql.credentials.postgresql.acid.zalan.do -o jsonpath={.data.password} | base64 -D)
cat .env > .local.env
echo "\nPG_PASS=${PG_PASS}" >> .local.env