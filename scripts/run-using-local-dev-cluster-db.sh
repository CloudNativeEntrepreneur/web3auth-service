#!/bin/sh

export PG_PASS=$(kubectl get secret readmodel.example-readmodel-postgresql.credentials.postgresql.acid.zalan.do -o jsonpath={.data.password} | base64 -D)
npm run dev