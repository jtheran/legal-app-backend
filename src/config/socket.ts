import { Server, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import config from './config'

let io: Server

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: `http://${config.HOST}:${config.PORT}`,
      credentials: true,
    },
  })

  io.on('connection', (socket: Socket) => {
    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`)
      console.log(`🔌 Usuario ${userId} conectado al socket`)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket desconectado')
    })
  })

  return io
}

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io no inicializado')
  return io
}