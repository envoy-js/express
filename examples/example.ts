import Envoy from "@envoy/express"
import express from "express";
import {createServer} from "http";
import {v4} from 'uuid';

const app = express();
const httpServer = createServer(app);
const port = 3000

const options = {
    userKey: "id" as const
}

interface User {
    username: string
    id: string
}

interface Message {
    id: string
    value: string
    roomid: string
}

interface Room {
    id: string
    users: User[]
}

const newRoom = {
    id: "1",
    users: []
}
const rooms: Room[] = [newRoom]

const envoy = new Envoy<User, Room, Message>(options, httpServer)

envoy.deserializeUser((res, req, next) => {
    const id = v4()
    const newUser = {
        username: id,
        id: id
    }
    const newUsers = new Set(rooms[0].users)
    newUsers.add(newUser)
    rooms[0].users = Array.from(newUsers)
    return newUser
})
envoy.deserializeMessage((socket, partialMessage: any) => {
    return {id: v4(), value: partialMessage.value, roomid: partialMessage.roomid, author: socket.user}
})

envoy.createRoom((room: Room) => {
    rooms.push(room)
})

envoy.joinRoom((room: Room, user: User) => {
    for (const r of rooms) {
        if (room === r) {
            const newUsers = new Set(rooms[0].users)
            newUsers.add(user)
            r.users = Array.from(newUsers)
        }
    }
})

envoy.leaveRoom((room: Room, user: User) => {

})

envoy.getRooms((user: User): Room[] => {
    return rooms
})

envoy.getUsersInRoom((message: Message): User[] => {
    console.log(rooms[0])
    return rooms[0].users
})

httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})