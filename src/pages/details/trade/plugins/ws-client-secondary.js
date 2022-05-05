import { XrplClient } from 'xrpl-client'

let ws = null

const connect = async (url, options) => {
    if (ws != null) return ws
    try {
        ws = new XrplClient(url, options)
        // ws = await connection.ready()
        return ws
    } catch(e) {
        throw(e)
    }
}

const getState = () => {
    if(ws === null) return null
    else return ws.getState()
}

const close = async () => {
    const closeInfo = await ws.close()
    console.log('Closed', closeInfo)
    ws = null
}

const send = async (command) => {
    const response = await ws.send(command)
    return response
}

const on = (event, fn) => {
    ws.on(event, fn)
}


export default {
    connect,
    getState,
    close,
    send,
    on
}