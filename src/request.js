//this helper function takes inspiration from the node request module

function REQUEST(opts) {
  this.params = this.initParams(opts)
  this.packet = this.makeHTTP(this.params)
}

REQUEST.prototype.processBody = (body) => [`Content-Length: ${body.length}`, '', body]

REQUEST.prototype.buildForm = (form) => Object.keys(form).map(i => `${i}=${form[i].replace(' ', '+')}`).join("&")
REQUEST.prototype.parse_addr = function(address, query) {
  const addr_parts = address.split('://')
  let addr = {
    host: addr_parts[0],
    path: '/',
    port: 80,
  }

  if(addr_parts.length !== 1) {
    if(['https', 'wss'].indexOf(addr_parts[0]) !== -1) {
      addr.port = 443
     }
        
    const full_addr = addr_parts[1].split('/')
    addr.host = full_addr[0] 
    addr.path = full_addr.length > 1 ? `/${full_addr.slice(1).join('/')}` : '/'
  } 

  if(query) {
    webLOG('REQUEST - QUERY')
    webLOG(query)
    addr = Object.assign(addr, {path: `${addr.path}?${this.buildForm(query)}`})
  }

  webLOG(addr)
  return addr
}

REQUEST.prototype.makeHTTP = function(params) {
  //start by adding the verb line
  let packet = []
  packet.push(`${params.method.toUpperCase()} ${params.path} HTTP/1.1`)
  //now add the header
  const headers = params.headers
  packet = packet.concat(Object.keys(headers).map(key => `${key}: ${headers[key]}`))

  //check if we have a body and add if required
  if(params.body) {
    packet = packet.concat(this.processBody(params.body))
  }

  //and we're done
  return `${packet.join("\r\n")}\r\n\r\n`
}

REQUEST.prototype.initParams = function(opts) {
  let params = {}
  //check if we only have an address or have an opts object
  if(typeof(opts) === 'string') {
    params = Object.assign({method: 'GET', uri: opts}, this.parse_addr(opts))
  } else {
    params = Object.assign({method: 'GET'}, opts, this.parse_addr(opts.uri, opts.query))
  }

  let headers = Object.assign({
    "User-Agent": "ZeeVee RTI",
    "Host": params.host
  }, params.headers)

  if(params.form) headers["Content-Type"] = "application/x-www-form-urlencoded"
  params.headers = headers

  if(params.form) params.body = this.buildForm(params.form)

  return params
}

REQUEST.prototype.parseHeader = function(header) {
  const lines = header.split('\n')

  //the first line should be the HTTP return code
  let header_lines = {
    code: parseInt(lines.shift().split(' ')[1], 10)
  } 
  
  lines.forEach(l => {
    const items = l.split(':')
    header_lines[items.shift()] = items.join(':').trim()
  })

  return header_lines
}

let request = (opts) => {
  return new REQUEST(opts)
}