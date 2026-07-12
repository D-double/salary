import { Readable } from 'node:stream';
import app from '../../server/app.js';
import { initDb } from '../../server/db.js';

let initialized = false;

export default async (event) => {
  if (!initialized) {
    await initDb();
    initialized = true;
  }

  const { httpMethod, path: urlPath, queryStringParameters, body, headers, isBase64Encoded } = event;

  const queryString = queryStringParameters
    ? '?' + new URLSearchParams(queryStringParameters).toString()
    : '';

  const reqBody = body
    ? (isBase64Encoded ? Buffer.from(body, 'base64').toString() : body)
    : '';

  return new Promise((resolve) => {
    const chunks = [];

    const reqStream = new Readable({
      read() {
        if (reqBody) {
          this.push(reqBody);
        }
        this.push(null);
      },
    });
    reqStream.method = httpMethod;
    reqStream.url = urlPath + queryString;
    reqStream.headers = { ...headers, host: headers.host || 'localhost' };
    reqStream.httpVersion = '1.1';

    let resHeaders = {};
    let resBody = '';
    let resStatusCode = 200;

    const res = {
      statusCode: 200,
      setHeader(name, value) { resHeaders[name.toLowerCase()] = String(value); },
      getHeader(name) { return resHeaders[name.toLowerCase()]; },
      removeHeader(name) { delete resHeaders[name.toLowerCase()]; },
      writeHead(code, hdrs) {
        resStatusCode = code;
        if (hdrs) {
          for (const [k, v] of Object.entries(hdrs)) {
            resHeaders[k.toLowerCase()] = String(v);
          }
        }
        return this;
      },
      write(chunk) {
        resBody += chunk;
        return true;
      },
      end(chunk) {
        if (chunk) resBody += chunk;
        resolve(new Response(resBody, {
          status: resStatusCode,
          headers: resHeaders,
        }));
        return this;
      },
      status(code) { resStatusCode = code; this.statusCode = code; return this; },
      json(data) {
        resHeaders['content-type'] = 'application/json';
        resolve(new Response(JSON.stringify(data), {
          status: resStatusCode,
          headers: resHeaders,
        }));
      },
      send(data) {
        if (typeof data === 'string') {
          resHeaders['content-type'] = resHeaders['content-type'] || 'text/plain';
          resolve(new Response(data, {
            status: resStatusCode,
            headers: resHeaders,
          }));
        } else if (Buffer.isBuffer(data)) {
          resolve(new Response(data, {
            status: resStatusCode,
            headers: resHeaders,
          }));
        } else {
          resHeaders['content-type'] = 'application/json';
          resolve(new Response(JSON.stringify(data), {
            status: resStatusCode,
            headers: resHeaders,
          }));
        }
      },
      sendStatus(code) {
        resolve(new Response(null, { status: code, headers: resHeaders }));
      },
    };

    app(reqStream, res, () => {
      resolve(new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }));
    });
  });
};

export const config = {
  path: '/api/*',
};
