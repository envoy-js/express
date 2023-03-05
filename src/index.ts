import {IncomingMessage, Server as htserver} from "http";
import {Server} from "socket.io";


interface UserIncomingMessage extends IncomingMessage {
    user: any
}

declare module 'socket.io' {
    interface Socket {
        user: any
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
    deserializeUserFunction: null | ((req: IncomingMessage, res: any, next: any) => UserType) = null

    constructor(options: Options<UserType>, httpServer: htserver) {
        this.options = options
        httpServer
        this.io = new Server(httpServer);
        const instance: Envoy<UserType> = this

        this.io.use((socket, next) => {
            socket.user = this.deserializeUserFunction ? this.deserializeUserFunction(socket.request, {}, next) : null
        })

        this.io.on("connection", (socket) => {
            new Connection(socket, socket.user, instance);
        });
    }

    deserializeUser(fn: typeof this.deserializeUserFunction) {
        this.deserializeUserFunction = fn
    }


}