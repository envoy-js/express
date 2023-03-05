import Envoy from "@envoy/express"
import express from "express";
import { createServer } from "http";
import { v4 } from 'uuid';

const app = express();
const httpServer = createServer(app);
const port = 3000

const options = {
    userKey: "username"
}

const envoy = new Envoy(options, httpServer)

httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})