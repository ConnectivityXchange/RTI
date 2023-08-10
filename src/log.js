//log levels
//
// 0 - Emergency (System.Print)
// 1 - Alert (System.Print)
// 2 - Critical (System.Print)
// 3 - Error (System.LogError)
// 4 - Warning (System.LogInfo(1))
// 5 - Information (System.LogInfo(2))
// 6 - Debug (System.LogInfo(3))
// x - Trace(System.LogInfo(3))

class LOG {
  constructor(options) {
    this.name = options.name || 'RTI Driver'

    this.localDebug = options.localDebug || false

    this.loglevels = ['emergency', 'alert', 'critical', 'error', 'warning', 'info', 'debug', 'trace']
    this.level = this.loglevels.indexOf(options.level || 'debug')

    System.Print(this.localDebug ? 'logging is enabled' : 'logging is disabled')
  }


  //
  // The func option shuld contain the calling functin using this.emergency.caller.name, but caller is undefined
  //

  emergency(data, extra) {
    this.log({
      level: "emergency",
      rti_level: 0,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  alert(data, extra) {
    this.log({
      level: "alert",
      rti_level: 0,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  critical(data, extra) {
    this.log({
      level: "critical",
      rti_level: 0,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  error(data, extra) {
    this.log({
      level: "error",
      rti_level: 1,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  warning(data, extra) {
    this.log({
      level: "warning",
      rti_level: 1,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  info(data, extra) {
    this.log({
      level: "info",
      rti_level: 1,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  support(data, extra) {
    this.log({
      level: "support",
      rti_level: 2,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  debug(data, extra) {
    this.log({
      level: "debug",
      rti_level: 3,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  trace(data, extra) {
    this.log({
      level: "trace",
      rti_level: 0,
      func: arguments.callee.caller.name,
      data,
      extra
    })
  }

  log(log_obj) {
    const { level, rti_level, func, data, extra } = log_obj
    if (this.loglevels.indexOf(level) > this.level) return
    const msg = (typeof (data) === 'object') ? JSON.stringify(data) : data
    if (!msg || msg.length == 0) return

    //we need to chunk the message because everything greater than 128 get clipped
    const chunkedmsg = this.chunkString(msg.toString(), 128)

    chunkedmsg.forEach(chunk => {
      //if we have a valid rti_level use System.LogInfo so it also prints to XP DIagnostics
      //everything else needs System.Print so it goes to TraceViewer
      //System.Print(`RTI_LEVEL: ${rti_level}, System.LogLevel: ${System.LogInfo}`)
      if (rti_level != 0 && System.LogLevel != 0) {
        System.LogInfo(rti_level, `[${level.toUpperCase()}] (${func}) ${chunk}`)
      }
      else {
        if (this.localDebug) System.Print(`[${level.toUpperCase()}] (${func}) ${chunk}`)
      }
    })
  }

  chunkString(str, length) {
    return str.match(new RegExp(`.{1,${length}}`, 'g'))
  }
}