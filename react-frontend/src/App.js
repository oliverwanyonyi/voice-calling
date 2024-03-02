import { useEffect, useRef, useState } from 'react'
import Peer from 'simple-peer'
import io from 'socket.io-client'

const socket = io.connect('http://localhost:3001')

const App = () => {
  const [me, setMe] = useState('')
  const [stream, setStream] = useState()
  const [receivingCall, setReceivingCall] = useState(false)
  const [caller, setCaller] = useState('')
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)
  const [idToCall, setIdToCall] = useState('')
  const [callEnded, setCallEnded] = useState(false)
  const [name, setName] = useState('')

  const myAudio = useRef()
  const userAudio = useRef()
  const connectionRef = useRef()

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setStream(stream)
        if (myAudio.current) {
          myAudio.current.srcObject = stream
        }
      })

    socket.off('me').on('me', id => {
      setMe(id)
    })

    socket.off('calluser').on('calluser', data => {
      console.log('twice',data);
      setReceivingCall(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })

  
  }, [])

  function callUser(id) {

    setCallEnded(false)
    let peer = new Peer({ initiator: true, trickle: false, stream: stream })

    peer.on('signal', data => {
      socket.emit('calluser', {
        userToCall: id,
        signalData: data,
        from: me,
        name: name
      })
    })

    peer.on('stream', stream => {
      userAudio.current.srcObject = stream
    })

    socket.on('callaccepted', signal => {
      setCallAccepted(true)
      console.log(peer);
      peer.signal(signal)
    })

    connectionRef.current = peer
  }

  const answerCall = () => {
    setCallEnded(false)
    setCallAccepted(true)
    const peer = new Peer({
      initiator: false, trickle: false, stream: stream
    })

    peer.on('signal', data => {
      socket.emit('answercall', { signal: data, to: caller })
    })

    peer.on('stream', stream => {
      userAudio.current.srcObject = stream
    })
    peer.signal(callerSignal)
    connectionRef.current = peer
  }

  const leaveCall = () => {
    setCallEnded(true)
    setCallAccepted(false)
    setReceivingCall(false)
    if (connectionRef.current) {
      connectionRef.current.destroy();
      connectionRef.current = null
    }
    window.location.reload()
  }

  

  return (
    <>
      <h1 style={{ textAlign: "center", color: '#fff' }}>Voice Calling App</h1>
      <div className="container">
        <div className="audio-container">
          <div className="audio">
            {stream && <audio ref={myAudio} autoPlay style={{ display: "none" }} />}
          </div>
          <div className="audio">
            {callAccepted && !callEnded ?
              <audio ref={userAudio} autoPlay style={{ display: "none" }} /> :
              null}
          </div>
        </div>
        <div className="myId">
          <input
            type='text'
            id="filled-basic"
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <input type='text' value={me} style={{ marginBottom: "2rem" }} />

          <input
            id="filled-basic"
            type='text'
            label="ID to call"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
          />
          <div className="call-button">
            {callAccepted && !callEnded ? (
              <button variant="contained" color="secondary" onClick={leaveCall}>
                End Call
              </button>
            ) : (
              <button color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
                Call Now
              </button>
            )}
            {idToCall}
          </div>
        </div>
        <div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <h1>{name} is calling...</h1>
              <button variant="contained" color="primary" onClick={answerCall}>
                Answer
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default App
