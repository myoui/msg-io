import React from 'react';
import { Routes, Route, Link , Outlet} from "react-router-dom";
import { useState, useEffect, useContext, useRef } from "react";
import { useInView } from 'react-intersection-observer';
import io from 'socket.io-client'
import './App.css';


// const SERVER = 'https://msg-io-server-fzrslso2hq-uw.a.run.app'
const SERVER = 'http://localhost:3005'

var socket = io(SERVER ,{ autoConnect: false })
const TEST_MSGS = [{uid:'NULLUID',
  username:'null',
  msg:'Inital message. Paper tiger is not a great way to fight a bear'},
  {uid:'UIDSELF',
  username:'null',
  self: true,
  msg:
  'Inital message2. Paper tiger is not a great way to fight a bear gabbergabbergabbergabbergabbergabbergabber'}]

function IoTest({userData}) {
  const [ioServerUrl, setServer] = useState(SERVER)

  const [isConnected, setConnected] = useState(socket.connected)
  const [sessID, setSession] = useState('')
  const [selfUID, setUID] = useState('UIDSELF')
  const [userName, setUser] = useState('')

  const [usersList, setUsersList] = useState([])

  const [inputMsg, setInput] = useState('')
  const [receivedMsg, setMsgs] = useState([])
  const [statusDisplay, setStatus] = useState('Ready')
  const [panelView, setPanel] = useState(false)
  
  const endMsg = useRef(null)
  const [endMsg2, endInView, entry] = useInView({
    threshold: 0.9
  })

  useEffect(()=>{ // fetch saved username and session id
    if (localStorage.hasOwnProperty('savedUser')) {
      setUser(localStorage.getItem('savedUser'))
    }
    if (localStorage.hasOwnProperty('sessionID')) {
      console.log(`sessionID ${localStorage.getItem('sessionID')}`)
      setSession(localStorage.getItem('sessionID'))
    }
    setPanel(true)
  },[])

  useEffect(()=>{
    const updater = setInterval(() => {
      checkIfConnected()
    }, 1000);
  },[])

  useEffect(() =>{
    // console.log('scrolled')
    scrollToEnd()
  },[receivedMsg])

  const scrollToEnd = () => {
    endMsg.current?.scrollIntoView({behavior: 'smooth'})    
  }

  const checkIfConnected = () => {
    if (socket.connected) {
      setConnected(true)
      setStatus('Connected')
    } else {
      setConnected(false)
      setStatus('Disconnected')
    }
  }

  const handleUserName = (event) => {
    setUser(event.target.value.replace(/[^a-zA-Z\d]/ig, "")) // alphanumerical only
  }

  const handleLogin = (event) => {
    localStorage.setItem('savedUser', userName)
    console.log('login clicked',userName,isConnected.toString())
    if (userName && !isConnected) {
      socket.auth = {username: userName, sessionID: sessID }
      socket.connect()
    } else if (!userName && !isConnected) {
      alert('Input Username')
    } else if (isConnected) {
      socket.disconnect()
    }
    checkIfConnected()
    setTimeout(()=> {
      console.log('timed')
      if (socket.connected) {
        setPanel(false)
      }
    },2000)
  }


  socket.onAny((event, args) =>{
    console.log(event)
  })
  socket.on('disconnect',() => {
    setUsersList([])
    checkIfConnected()
  })
  socket.on('message', (msg) => {
    console.log(msg.username, msg.msg)
    if (msg.username !== userName) {
      pushMsg(msg)
    }
  })
  socket.on('userList', (msg) => {
    console.log(msg)
    setUsersList(msg.split('(*)'))
  })
  socket.on('session', (args) => {
    console.log(`Got sessionID ${args.sessionID}`)
    localStorage.setItem('sessionID', args.sessionID)
    setUID(args.userID)
  })

  const handleMsgChange = (event) => {
    setInput(event.target.value)
  } 
  
  const pushMsg = (msgObj) => { // Add messages to state
    console.log(msgObj)
    msgObj.uid == selfUID ? msgObj.self = true : msgObj.self = false
    setMsgs([...receivedMsg, msgObj])
    scrollToEnd()
  }

  const handleSubmit = (event) => {
    checkIfConnected()
    if (!isConnected) {
      pushMsg({
        username: 'SYSTEM',
        msg: 'Not connected. Unable to send message.'
      })
    }
    else if (userName && inputMsg) {
      let msgObj = {
        uid: socket.id ? socket.id : 'UIDSELF', //--update this
        username: userName,
        msg: inputMsg
      }  
      pushMsg(msgObj)
      socket.emit('message',msgObj)
      setInput('')
    } else {
      alert('No connection or no input.')
    }
  }
  
  const handleReturnKey = (event) => {
    if (event.key === 'Enter') {
      handleSubmit()
    } else if (event.key === 'End') {
      scrollToEnd()
    }
  }

  const togglePanel = (event) => {
    setPanel(!panelView)
  }
  return (
      <div>
          {userName}-
          {receivedMsg.length}-
          {selfUID}
          <div className='viewArea'>
            {receivedMsg.map((item,key) => {
              return <TextObject divKey={key} entry={item}/>
            }
            )}
            <div className='scrollEnd' onClick={scrollToEnd}>{endInView? " ":"⬇️"}</div>
            <div ref={endMsg}><div ref={endMsg2}/></div>
          </div>
          
          <div className='submitArea'>
              <input className='msgBox'type='text' placeholder='Send a message...'
                value={inputMsg} onChange={handleMsgChange} onKeyDown={handleReturnKey}/>
              <button className='sendBtn' onClick={handleSubmit}>Send</button>
          </div>

          <div className='status'>{statusDisplay}</div>
          <div className='userList'>
            {usersList.map((item,key) => {
              return <UserObject user={item} key={key}/>
            })}
          </div>
          <div className={panelView ? 'userPanel' : 'userPanel min'}>
            <div onClick={togglePanel}>
              {panelView? 'Close' : 'Menu' }
            </div>
            <div className={panelView ? '': 'hide'}>
              <input className='userBox' type='text' value={userName} placeholder="Set user name..."
                onChange={handleUserName}
                disabled={isConnected? true:false}></input>
              <button className='logInBtn' onClick={handleLogin}>{isConnected? "Logout":"Login"}</button>
            </div>
          </div>
      </div>
  )
}


function NavigateS() {
  return (
    <div className='navDiv'>
      First Nav<br></br>
      Second Nav<br></br>
      Third Nav<br></br>
    </div>
   
  )
}
function UserObject({user, key}) {
  const [username, userid] = user.split('//')
  return (
    <div className='userListItem' key={key}>
      {username} ({userid})
    </div>
  )
}

function TextObject({divKey,entry}) {
  if (entry.username == 'SYSTEM') {
    return (
      <div key={divKey} className='msgSystem'>
        SYSTEM : {entry.msg}<br></br>
        {SERVER}
      </div>
    )
  } else {
  // console.log('TextObject', entry)
  return (
      <div key={divKey} className={ entry.self ? 'msgBody-self':'msgBody'}>
        [{entry.uid}] {entry.username}: {entry.msg}
      </div>
    )
  }
}
function Content() {
  const testText = [
    {
      uid: 'User 1',
      visible: true,
      body: 'Texto Unionum Boxing Holidays?'
    },
    {
      uid: 'User 1',
      visible: true,
      body: 'Texto Unionum Boxing Holidays!'
    }
  ]

  return (
    <div>
      {testText.map((item, key)=>{
        return <TextObject divKey={key} entry={item}/>
      })}
      <TextObject entry={{ 
        uid:'User 0',
        body: 'El Pebble Dashing Goring'
      }}/>
    </div>
  )
}

function App() {

  const [userName, setUser] = useState('')
  
  return (
      <div>

        <div className='App'>
          <Outlet/>
        </div>
        <div className='footer'>
        </div>
      </div>
  );
}


export {
  App,
  Content,
  IoTest
}
