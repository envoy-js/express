import {IncomingMessage, Server as htserver} from "http";
import {Server, ServerOptions, Socket} from "socket.io";

declare module 'socket.io' {
    interface Socket {
        user: any
    }
}

export interface Options<UserType, RoomType, MessageType> {
    userKey: keyof UserType,
    serverOptions?: Partial<ServerOptions>
}

class Connection<UserType, RoomType, MessageType> {
    user: UserType | null
    io: Server
    socket: any
    envoy: Envoy<UserType, RoomType, MessageType>

    constructor(socket: any, user: UserType | null, envoy: Envoy<UserType, RoomType, MessageType>) {
        this.user = user
        this.io = envoy.io
        this.socket = socket
        this.envoy = envoy

        socket.emit("userLogin", this.user)

        socket.on("clientMessage", (value: any) => {
            if (envoy.deserializeMessageFunction) {
                const message = envoy.deserializeMessageFunction(socket, value)
                if (envoy.getUsersInRoomFunction) {
                    for (const user of envoy.getUsersInRoomFunction(message)) {
                        const listConnections = envoy.connections.get(user[envoy.options.userKey]) || []
                        for (const connection of listConnections) {
                            connection.socket.emit("serverMessage", message)
                        }
                    }
                }
            }
        })

        socket.on("clientJoinRoom", (room: RoomType, user: UserType) => {
            if (envoy.joinRoomFunction) {
                envoy.joinRoomFunction(room, socket.user)
            }
        })

        socket.on("clientLeaveRoom", (room: RoomType, user: UserType) => {
            if (envoy.leaveRoomFunction) {
                envoy.leaveRoomFunction(room, socket.user)
            }
        })

        socket.on("clientCreateRoom", (room: RoomType) => {
            if (envoy.createRoomFunction) {
                envoy.createRoomFunction(room)
            }
        })
    }
}

export default class Envoy<UserType, RoomType, MessageType> {
    options: Options<UserType, RoomType, MessageType>
    io: Server
    deserializeUserFunction: null | ((req: IncomingMessage, res: any, next: any) => UserType) = null
    deserializeMessageFunction: null | ((socket: Socket, partialMessage: any) => MessageType) = null
    getRoomHistoryFunction: null | ((room: RoomType) => MessageType[]) = null
    getRoomsFunction: null | ((user: UserType) => RoomType[]) = null
    getUsersInRoomFunction: null | ((message: MessageType) => UserType[]) = null
    joinRoomFunction: null | ((room: RoomType, user: UserType) => void) = null
    leaveRoomFunction: null | ((room: RoomType, user: UserType) => void) = null
    createRoomFunction: null | ((room: RoomType) => void) = null
    connections: Map<any, Connection<UserType, RoomType, MessageType>[]> = new Map()

    constructor(options: Options<UserType, RoomType, MessageType>, httpServer: htserver) {
        this.options = options
        this.io = new Server(httpServer, {
            ...options.serverOptions
        })
    }

    initialize() {
        this.io.use((socket, next) => {
            socket.user = this.deserializeUserFunction ? this.deserializeUserFunction(socket.request, {}, next) : null
            next()
        })

        this.io.on("connection", (socket) => {
            const newConnection = new Connection(socket, socket.user, this);
            const listConnections = this.connections.get(socket.user[this.options.userKey])
            if (this.getRoomsFunction) {
                const rooms = this.getRoomsFunction(socket.user)
                socket.emit("allRooms", rooms.map((room) => ({
                    messages: this.getRoomHistoryFunction ? this.getRoomHistoryFunction(room) : [],
                    room
                })))
            }
            if (listConnections === undefined) {
                this.connections.set(socket.user[this.options.userKey], [newConnection])
            } else {
                listConnections.push(newConnection)
            }
        });
    }

    emitMessage(message: MessageType) {
        if (this.getUsersInRoomFunction) {
            for (const user of this.getUsersInRoomFunction(message)) {
                const listConnections = this.connections.get(user[this.options.userKey]) || []
                for (const connection of listConnections) {
                    connection.socket.emit("serverMessage", message)
                }
            }
        }
    }

    getUsersInRoom(fn: typeof this.getUsersInRoomFunction) {
        this.getUsersInRoomFunction = fn
    }

    joinRoom(fn: typeof this.joinRoomFunction) {
        this.joinRoomFunction = fn
    }

    leaveRoom(fn: typeof this.leaveRoomFunction) {
        this.leaveRoomFunction = fn
    }

    createRoom(fn: typeof this.createRoomFunction) {
        this.createRoomFunction = fn
    }

    getRooms(fn: typeof this.getRoomsFunction) {
        this.getRoomsFunction = fn
    }

    deserializeUser(fn: typeof this.deserializeUserFunction) {
        this.deserializeUserFunction = fn
    }

    deserializeMessage(fn: typeof this.deserializeMessageFunction) {
        this.deserializeMessageFunction = fn
    }

    getRoomHistory(fn: typeof this.getRoomHistoryFunction) {
        this.getRoomHistoryFunction = fn
    }
}