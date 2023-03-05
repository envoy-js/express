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

const newRoom = {
    id: "1",
    users: []
}
const rooms: Room[] = [newRoom]
const history: Message[] = []

const envoy = new Envoy<User, Room, Message>(options, httpServer)

const avatars = [
    'https://thesocietypages.org/socimages/files/2009/05/flickr-buddyicon.jpg',
    'https://thesocietypages.org/socimages/files/2009/05/hotmail.png',
    'https://thesocietypages.org/socimages/files/2009/05/googleyeyes.png',
    'https://thesocietypages.org/socimages/files/2009/05/vimeo.jpg',
    'https://thesocietypages.org/socimages/files/2009/05/myspacenophoto.jpg',
    'https://thesocietypages.org/socimages/files/2009/05/nomugshot-large.png',
    'https://thesocietypages.org/socimages/files/2009/05/nopic_192.gif'
]

envoy.deserializeUser((res, req, next) => {
    const id = v4()
    const newUser = {
        username: id,
        id: id,
        avatar: avatars[Math.floor(Math.random() * avatars.length)]
    }
    const newUsers = new Set(rooms[0].users)
    newUsers.add(newUser)
    rooms[0].users = Array.from(newUsers)
    return newUser
})
envoy.deserializeMessage((socket, partialMessage: any) => {
    const msg = {id: v4(), value: partialMessage.value, roomid: partialMessage.roomid, author: socket.user}
    history.push(msg)
    return msg
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

envoy.getRoomHistory((room: Room) => {
    return history
})

httpServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})