import koa from 'koa'
import test from 'ava'
import cors from '../src'
import request from 'request'
import mount from 'koa-mount'

const req = request.defaults({
    json: true,
    baseUrl: 'http://localhost:3000'
})

test.before.cb((t) => {
    let app = koa()

    app.use(cors({
        maxAge: 10000,
        credentials: true,
        exposeHeaders: ['x-token'],
        origin: ['http://halojs.com', /http:\/\/halo.com/]
    }))
    app.use(mount('/cors', function *() {
        this.body = { ok: 1 }
    }))
    app.listen(3000, t.end)
})

test.cb('no origin headers', (t) => {
    req.get('/cors', (err, res, body) => {
        t.is(body.ok, 1)
        t.is(!!res.headers['access-control-allow-origin'], false)
        t.end()
    })
})

test.cb('origin header is not in scope', (t) => {
    req.get('/cors', {
        headers: {
            'Origin': 'http://koajs.com'
        }
    }, (err, res, body) => {
        t.is(body.ok, 1)
        t.is(!!res.headers['access-control-allow-origin'], false)
        t.end()
    })
})

test.cb('origin header is string', (t) => {
    req.get('/cors', {
        headers: {
            'Origin': 'http://halojs.com'
        }
    }, (err, res, body) => {
        t.is(body.ok, 1)
        t.is(res.headers['vary'], 'Origin')
        t.is(res.headers['access-control-allow-credentials'], 'true')
        t.is(res.headers['access-control-allow-origin'], 'http://halojs.com')
        t.end()
    })
})

test.cb('origin header is regexp', (t) => {
    req.get('/cors', {
        headers: {
            'Origin': 'http://halo.com'
        }
    }, (err, res, body) => {
        t.is(body.ok, 1)
        t.is(res.headers['vary'], 'Origin')
        t.is(res.headers['access-control-allow-credentials'], 'true')
        t.is(res.headers['access-control-allow-origin'], 'http://halo.com')
        t.end()
    })
})

test.cb('preflight request', (t) => {
    req({
        url: '/cors',
        method: 'OPTIONS',
        headers: {
            'Origin': 'http://halojs.com',
            'Access-Control-Request-Method': 'PUT',
            'Access-Control-Request-Headers': 'x-token'
        }
    }, (err, res, body) => {
        t.is(res.statusCode, 204)
        t.is(res.headers['access-control-max-age'], '10000')
        t.is(res.headers['access-control-allow-headers'], 'x-token')
        t.is(res.headers['access-control-allow-origin'], 'http://halojs.com')
        t.is(res.headers['access-control-allow-methods'], 'GET,POST,PUT,DELETE,HEAD,PATCH')
        t.end()
    })
})

test.cb('preflight request, but no set Access-Control-Request-Method header', (t) => {
    req({
        url: '/cors',
        method: 'OPTIONS',
        headers: {
            'Origin': 'http://halojs.com'
        }
    }, (err, res, body) => {
        t.is(res.statusCode, 200)
        t.is(!!res.headers['access-control-allow-origin'], false)
        t.end()
    })
})

test.cb('origin is *', (t) => {
    koa().use(cors({
        maxAge: 10000,
        credentials: true,
        exposeHeaders: ['x-token'],
        origin: ['http://halojs.com', '*']
    })).listen(3001, t.end)

    request.get('http://localhost:3001/cors', {
        headers: {
            'Origin': 'http://halojs.com'
        }
    }, (err, res, body) => {
        t.is(res.headers['access-control-allow-origin'], '*')
        t.is(res.headers['access-control-expose-headers'], 'x-token')
        t.is(!!res.headers['access-control-allow-credentials'], false)
        t.end()
    })
})