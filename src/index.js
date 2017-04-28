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

    return function* _cors(next) {
        let origin, allowedHeaders
        
        origin = this.get('Origin')

        if (!origin) {
            return yield* next
        }
        
        if (!isAllowOrigin(options.origin, origin)) {
            return yield* next
        }

        if (this.method.toUpperCase() === 'OPTIONS' && !this.get('Access-Control-Request-Method')) {
            return yield* next
        }
        
        if (!options.origin.includes('*')) {
            this.vary('Origin')
        }

        this.set('Access-Control-Allow-Origin', options.origin.includes('*') ? '*' : origin)

        if (options.credentials && !options.origin.includes('*')) {
            this.set('Access-Control-Allow-Credentials', 'true')
        }

        if (this.method.toUpperCase() === 'OPTIONS') {
            allowedHeaders = options.allowedHeaders.join(',')

            if (options.methods.length) {
                this.set('Access-Control-Allow-Methods', options.methods.join(','))
            }

            if (options.maxAge) {
                this.set('Access-Control-Max-Age', options.maxAge.toString())
            }

            if (!allowedHeaders) {
                allowedHeaders = this.get('Access-Control-Request-Headers')
            }

            if (allowedHeaders) {
                this.set('Access-Control-Allow-Headers', allowedHeaders)
            }

            this.status = 204
        } else {
            if (options.exposeHeaders.length) {
                this.set('Access-Control-Expose-Headers', options.exposeHeaders.join(','))
            }

            yield* next
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