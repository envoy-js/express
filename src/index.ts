import {IncomingMessage, Server as htserver} from "http";
import {Server} from "socket.io";

declare module 'socket.io' {
    interface Socket {
        user: any
    }
}

export interface Options<UserType,RoomType,MessageType> {
    userKey: keyof UserType
}

class Connection<UserType,RoomType,MessageType> {
    user: UserType | null
    io: Server
    socket: any
    envoy: Envoy<UserType,RoomType,MessageType>

    constructor(socket: any, user: UserType | null, envoy: Envoy<UserType,RoomType,MessageType>) {
        this.user = user
        this.io = envoy.io
        this.socket = socket
        this.envoy = envoy

        socket.on("clientMessage", (message: MessageType) => {
            if (envoy.getUsersInRoomFunction) {
                for (const user of envoy.getUsersInRoomFunction(message)) {
                    const listConnections = envoy.connections.get(user[envoy.options.userKey])
                    if (listConnections) {
                        for (const connection of listConnections) {
                            connection.socket.emit("serverMessage", message)
                        }
                    }
                }
            }
        })

        socket.on("clientJoinRoom", (room: RoomType) => {
            if (envoy.addRoomFunction) {
                envoy.addRoomFunction(room)
            }
        })

        socket.on("clientLeaveRoom", (room: RoomType) => {
            if (envoy.leaveRoomFunction) {
                envoy.leaveRoomFunction(room)
            }
        })
    }
}

export default class Envoy<UserType,RoomType,MessageType> {
    options: Options<UserType,RoomType,MessageType>
    io: Server
    deserializeUserFunction: null | ((req: IncomingMessage, res: any, next: any) => UserType) = null
    getRoomsFunction: null | ((user: UserType) => RoomType[]) = null
    getUsersInRoomFunction: null | ((message: MessageType) => UserType[]) = null
    addRoomFunction: null | ((room: RoomType) => void) = null
    leaveRoomFunction: null | ((room: RoomType) => void) = null
    connections: Map<any, Connection<UserType,RoomType,MessageType>[]> = new Map()
    constructor(options: Options<UserType,RoomType,MessageType>, httpServer: htserver) {
        this.options = options
        httpServer
        this.io = new Server(httpServer);
        const instance: Envoy<UserType,RoomType,MessageType> = this


        this.io.use((socket, next) => {
            socket.user = this.deserializeUserFunction ? this.deserializeUserFunction(socket.request, {}, next) : null
        })

        this.io.on("connection", (socket) => {
            const newConnection = new Connection(socket, socket.user, instance);
            const listConnections = this.connections.get(socket.user[this.options.userKey])
            if (listConnections === undefined) {
                this.connections.set(socket.user[this.options.userKey], [newConnection])
            } else {
                listConnections.push(newConnection)
            }
        });
    }

    getUsersInRoom(fn: typeof this.getUsersInRoomFunction) {
        this.getUsersInRoomFunction = fn
    }

    addRoom(fn: typeof this.addRoomFunction) {
        this.addRoomFunction = fn
    }

    leaveRoom(fn: typeof this.leaveRoomFunction) {
        this.leaveRoomFunction = fn
    }

    getRooms(fn: typeof this.getRoomsFunction) {
        this.getRoomsFunction = fn
    }

    deserializeUser(fn: typeof this.deserializeUserFunction) {
        this.deserializeUserFunction = fn
    }
}