# envoy-js/express
## Installation 
envoy-js/express is available on [npm](https://www.npmjs.com/package/@envoy-js/express)

Using npm
``` 
npm i @envoy-js/express
```
or yarn
``` 
yarn add @envoy-js/express
```
## Examples
### Typescript Quickstart

```ts
import Envoy from "@envoy/express"
import express from "express";
import {createServer} from "http";

const app = express();
const httpServer = createServer(app);
const port = 3000

interface User {
    username: string
    id: string,
    avatar: string
}

interface Message {
    id: string
    value: string
    roomid: string
}

interface Room {
    id: string
    users: User[],
}

const envoy = new Envoy<User, Room, Message>({userKey: "id" as const}, httpServer)

httpServer.listen(port, () => {
    console.log(`Envoy app listening on port ${port}`)
})
```


Here is a sample React app

[React](https://github.com/envoy-js/envoy-example)