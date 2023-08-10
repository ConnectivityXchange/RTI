function ZYPER(opts) {
  
  this.addr = opts.addr
  this.host = ''
  this.port = 0

  this.query = {}
  this.state = {}
  this.conn = new HTTP(opts.rx)

  this.encoderList = new SystemVarsList("encoderList")
  this.decoderList = new SystemVarsList("decoderList")

  this.selectedEncoder = ""
  this.selectedDecoder = ""

  this.queue = new Queue()

  //
  // initialisation
  //

  this.conn.UseHandleInCallbacks = true

  this.conn.OnConnectFunc = zyperConnect
  this.conn.OnDisconnectFunc = zyperDisconnect
  this.conn.OnConnectFailedFunc = zyperConnectFailed
  this.conn.OnSSLHandshakeOKFunc = zyperSSLConnect
  this.conn.OnSSLHandshakeFailedFunc = zyperSSLFailed

  this.sendQueue = () => {
    if(this.queue.isEmpty()) {
      log.info(`Queue is empty, closing connection`)
      this.comm.Close()
      return
    }

    this.connect()
  }

  this.connect = () =>  {
    log.info(`CONNECT: host:${this.host}, port: ${this.port}`)
    this.conn.Open(this.host, this.port)
    this.conn.AddRxHTTPFraming()
  }

  this.getStatus = () => this.sendCommand('show device status all')
  this.join = (enc, dec, mode) => this.sendCommand(`join ${enc} ${dec} ${mode}`)
  this.send232 = (name, data) => this.sendCommand(`send ${name} rs232 \"${data}\"`)
  this.flash = (name) => this.sendCommand(`flash-leds ${name}`)

  //Video Wall Commands
  this.createWall = (dec, name, row, col) => this.sendCommand(`set video-wall-decoder ${dec} ${name} ${row} ${col}`)
  this.createVideoWall = (name) => this.sendCommand(`create video-wall ${name}`)
  this.deleteVideoWall = (name) => this.sendCommand(`delete video-wall ${name}`)
  this.wall = (name, enc) => this.sendCommand(`set video-wall-encoder ${enc} ${name}`)

  //multiview Commands
  this.multiviewAudio = (name, source) => {
    this.sendCommand(`set multiview ${name} audio-source window number ${source == 0 ? 'none' : source}`)
  }

  this.selectEncoder = (index, top) => {
    let name = this.encoderList.ReadAt(index)
    log.info(`ENCODER: Index: ${index}, top: ${top} - ${name}`)
    this.selectedEncoder = name
    this.encoderList.SetMarked(index)
  }

  this.selectDecoder = (index, top) => {
    let name = this.decoderList.ReadAt(index)
    log.info(`DECODER: Index: ${index}, top: ${top} - ${name}`)
    this.selectedDecoder = name
    this.decoderList.SetMarked(index)
  }

  this.select = (mode) => this.join(this.selectedEncoder, this.selectedDecoder, mode)

  this.sendCommand = (command) => {
    log.debug(`SENDING COMMAND: ${command}`)
    const query = {
      type: 'command',
      command: command,
      request: request({
        uri: `http://${this.addr}/rcCmd.php`,
        header: {"Cookie" : this.state.cookie},
        method: 'POST',
        form: {serverSocketName: 'rcServerSocket', commands: command}
      })
    }

    this.host = query.request.params.host
    this.port = query.request.params.port
    
    this.queue.enqueue(query)
    this.connect()
  }

  this.login = (username, password) => {

    const query = {
      type: 'login',
      command: '',
      request: request({
        uri: `http://${this.addr}/rcLogin.php`,
        method: 'POST',
        form: {serverSocketName: 'rcServerSocket', username: username, password: password}
      })
    }

    this.host = query.request.params.host
    this.port = query.request.params.port
    
    this.queue.enqueue(query)
    this.connect()
  }

  this.process = (data) => {
    if(data === 'Success') return
    log.info("PROCESS DATA")

    const command = data.responses[0].command[0]
    if(data.status !== "Success"){
      log.warning(`Command ${command} failed to send`)
      return
    }

    log.info(`processing command ${command}`)
    switch(command) {
      case 'show device status all':
        const resp = data.responses[0].text.map(i => i.gen)
        this.encoderList.Open()
        this.encoderList.RemoveAll()
        log.debug(resp.filter(i => i.type === "encoder"))
        resp.filter(i => i.type === "encoder").forEach(e => this.encoderList.Insert(e.name))
        this.encoderList.Close()
        this.decoderList.Open()
        this.decoderList.RemoveAll()
        log.debug(resp.filter(i => i.type === "decoder"))
        resp.filter(i => i.type === "decoder").forEach(e => this.decoderList.Insert(e.name))
        this.decoderList.Close()
        break
      default:
        log.debug(data)        
    }

    if(!this.queue.isEmpty()) this.sendQueue()
  }

  //
  //HTTP handlers
  //
  this.onConnect = () => {
    this.query = this.queue.dequeue()
    this.conn.Write(this.query.request.packet)
  }
  this.onConnectFailed = () => log.warning(`zyper connection failed`, 3)
  this.onDisconnect = () => log.warning(`zyper - HTTP disconnect`, 7)
  this.rx = (data) => {
    const data_split = data.split('\r\n\r\n')
    this.state.header = this.query.request.parseHeader(data_split[0])
    const body = data_split[1] || ''

    log.info(`body len: ${body.length}`)
    if(body.length == 0) {
      log.debug('body len in 0, printing data packet')
      log.debug(data)
      return 
    }
    
    this.conn.Close()

    if(this.query.type == 'login') {
      this.state.cookie = this.state.header["Set-Cookie"].split(';')[0]
      this.getStatus() 
    }
   
    this.process(JSON.parse(body))
  }
}    
