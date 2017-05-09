// Thanks to:
//   - https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS

export default function (options) {
    options = Object.assign({}, {
        maxAge: 0,
        origin: [],
        exposeHeaders: [],
        allowedHeaders: [],
        credentials: false,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH']
    }, options)

    return async function _cors(ctx, next) {
        let origin, allowedHeaders
        
        origin = ctx.get('Origin')

        if (!origin) {
            return await next()
        }
        
        if (!isAllowOrigin(options.origin, origin)) {
            return await next()
        }

        if (ctx.method.toUpperCase() === 'OPTIONS' && !ctx.get('Access-Control-Request-Method')) {
            return await next()
        }
        
        if (!options.origin.includes('*')) {
            ctx.vary('Origin')
        }

        ctx.set('Access-Control-Allow-Origin', options.origin.includes('*') ? '*' : origin)

        if (options.credentials && !options.origin.includes('*')) {
            ctx.set('Access-Control-Allow-Credentials', 'true')
        }

        if (ctx.method.toUpperCase() === 'OPTIONS') {
            allowedHeaders = options.allowedHeaders.join(',')

            if (options.methods.length) {
                ctx.set('Access-Control-Allow-Methods', options.methods.join(','))
            }

            if (options.maxAge) {
                ctx.set('Access-Control-Max-Age', options.maxAge.toString())
            }

            if (!allowedHeaders) {
                allowedHeaders = ctx.get('Access-Control-Request-Headers')
            }

            if (allowedHeaders) {
                ctx.set('Access-Control-Allow-Headers', allowedHeaders)
            }

            ctx.status = 204
        } else {
            if (options.exposeHeaders.length) {
                ctx.set('Access-Control-Expose-Headers', options.exposeHeaders.join(','))
            }

            await next()
        }
    }
}

function isAllowOrigin(configOrigin, requestOrigin) {
    for (let item of configOrigin) {
        if (isString(item) && (item === requestOrigin || item === '*')) {
            return true
        } else if (isRegExp(item) && item.test(requestOrigin)) {
            return true
        }
    }

    return false
}

function isString(str) {
    return typeof str === 'string'
}

function isRegExp(regexp) {
    return regexp instanceof RegExp
}