import {IncomingMessage, Server as htserver} from "http";
import {Server} from "socket.io";
import {Express, Request, Response, NextFunction} from 'express';


declare global {
    namespace Express {
        interface Request {
            user: any
        }
    }
}

export interface Options<UserType> {
    userKey: keyof UserType
}

interface Room<UserType> {
    id: string,
    members: UserType[]
    image: string
}

export interface User {
    id: string,
    username: string,
}

interface Message<UserType> {
    id: string,
    user: UserType,
    value: string,
    time: Date
}

export class Connection<UserType> {
    user: UserType | null
    io: Server
    socket: any
    envoy: Envoy<UserType>

    constructor(socket: any, user: UserType | null, envoy: Envoy<UserType>) {
        this.user = user
        this.io = envoy.io
        this.socket = socket
        this.envoy = envoy

        socket.on("clientMessage", (value: string, roomid: string) => {

        })
        socket.on("clientJoinRoom", (roomid: string) => {

        })
    }
}

export default class Envoy<UserType> {
    // .use to add middleware
    // store actual socket
    options: Options<UserType>
    io: Server
    deserializeUserFunction: null | ((req: Request, res: Response, next: NextFunction) => UserType) = null

    constructor(options: Options<UserType>, httpServer: htserver) {
        this.options = options
        httpServer
        this.io = new Server(httpServer);
        const instance: Envoy<UserType> = this

        this.io.engine.use((req: Request, res: Response, next: NextFunction) => {
            req.user = this.deserializeUserFunction ? this.deserializeUserFunction : null
        })

        this.io.on("connection", (socket) => {
            new Connection(socket, socket.request.session, instance);
        });
    }

    deserializeUser(fn: (req: IncomingMessage, res: Response, next: NextFunction) => UserType) {
        this.deserializeUserFunction = fn
    }


}