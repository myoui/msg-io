import React from 'react';
import { useState, useEffect } from "react";
import './App.css';
import io from 'socket.io-client'


const socket = io()

function IoTest() {
    const [isConnected, setConnected] = useState(socket.connected)
    useEffect(()=>{

    },[])
    return (
        <div>
            {socket.connected.toString()}
        </div>
    )
}


