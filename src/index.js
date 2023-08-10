const NAME = `Zyper`
const VERSION = 20180926

//set global licence validity flag
const log = new LOG(NAME, Config.Get("CloudLog") == "true")
let zyper = {}

//init a new licence object

const start = (valid) => {
  SystemVars.Write("licenceInfo", `licence state is ${valid}`)
  SystemVars.Write("licenceValid", valid)
  webLOG(`licence state is ${valid}`, 4)

  if(!valid) {
    webLOG("licence check failed, please check licencing details")
    return
  }

  initZyper()

  const poll_interval = Config.Get("poll_interval")
  const stateTimer = new ScheduledEvent(getStatus, "Periodic", "Seconds", poll_interval)
}


//Driver command functions
const getStatus = () => zyper.getStatus()
const join = (enc, dec, mode) => zyper.join(enc, dec, mode)
const send232 = (name, data) => zyper.send232(name, data)
const selectEncoder = (idx, top) => zyper.selectEncoder(idx, top)
const selectDecoder = (idx, top) => zyper.selectDecoder(idx, top)
const select = (mode) => zyper.select(mode)
const flash = (name) => zyper.flash(name)

//Video Wall Commands
const createWall = (dec, name, row, col) => zyper.createWall(dec, name, row, col)
const createVideoWall = (name) => zyper.createVideoWall(name)
const deleteVideoWall = (name) => zyper.deleteVideoWall(name)
const wall = (name, enc) => zyper.wall(name, enc)

//multiview commands
const multiview = (name, dec) => zyper.join(name, dec, 'multiview')
const multiviewAudio = (name, source) => zyper.multiviewAudio(name, source)

//zyper HTTP functions
const zyperConnect = () => zyper.onConnect()
const zyperDisconnect = () => zyper.onDisconnect()
const zyperConnectFailed = () => zyper.onConnectFailed()
const zyperSSLConnect = () => zyper.onSSLConnect()
const zyperSSLFailed = () => zyper.onSSLFailed()
const zyperRx = (data) => zyper.rx(data)

zyper = new ZYPER({
  rx: zyperRx,
  addr: Config.Get("addr")
})

const initZyper = () => {
  webLOG(`init zyper...`)
  zyper.login(Config.Get("username"), Config.Get("password"))
}

start(licenceCheck(Config.Get("Licence"), NAME))