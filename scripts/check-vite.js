import http from 'http'
const paths = ['/', '/index.html', '/dashboard', '/login', '/__vite/client', '/vite.svg']
;(async () => {
  for (const path of paths) {
    const opts = { hostname: '::1', port: 3000, path, method: 'GET', family: 6 }
    await new Promise((resolve) => {
      const req = http.request(opts, (res) => {
        console.log('REQUEST', path)
        console.log('STATUS', res.statusCode)
        console.log('TYPE', res.headers['content-type'])
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          console.log('BODY', body.slice(0, 200).replace(/\n/g, ' '))
          console.log('---')
          resolve()
        })
      })
      req.on('error', (e) => {
        console.log('REQUEST', path)
        console.log('ERROR', e.message)
        console.log('---')
        resolve()
      })
      req.end()
    })
  }
})()
