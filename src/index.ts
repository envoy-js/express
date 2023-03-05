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

export interface Options<UserType,RoomType> {
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

export class Connection<UserType,RoomType> {
    user: UserType | null
    io: Server
    socket: any
    envoy: Envoy<UserType,RoomType>

    constructor(socket: any, user: UserType | null, envoy: Envoy<UserType,RoomType>) {
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

export default class Envoy<UserType,RoomType> {
    // .use to add middleware
    // store actual socket
    options: Options<UserType,RoomType>
    io: Server
    deserializeUserFunction: null | ((req: IncomingMessage, res: any, next: any) => UserType) = null
    getRoomsFunction: null | ((req: UserType) => RoomType) = null
    constructor(options: Options<UserType,RoomType>, httpServer: htserver) {
        this.options = options
        httpServer
        this.io = new Server(httpServer);
        const instance: Envoy<UserType,RoomType> = this

        this.io.use((socket, next) => {
            socket.user = this.deserializeUserFunction ? this.deserializeUserFunction(socket.request, {}, next) : null
        })

        this.io.on("connection", (socket) => {
            new Connection(socket, socket.user, instance);
        });
    }
    
    getRooms(fn: (req: UserType) => RoomType) {
        this.getRoomsFunction = fn
    }

    deserializeUser(fn: typeof this.deserializeUserFunction) {
        this.deserializeUserFunction = fn
    }
}