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
        resolve({
          statusCode: resStatusCode,
          headers: resHeaders,
          body: resBody,
          isBase64Encoded: false,
        });
        return this;
      },
      status(code) { resStatusCode = code; this.statusCode = code; return this; },
      json(data) {
        resHeaders['content-type'] = 'application/json';
        resBody = JSON.stringify(data);
        resolve({
          statusCode: resStatusCode,
          headers: resHeaders,
          body: resBody,
          isBase64Encoded: false,
        });
      },
      send(data) {
        if (typeof data === 'string') {
          resHeaders['content-type'] = resHeaders['content-type'] || 'text/plain';
          resBody = data;
        } else {
          resBody = JSON.stringify(data);
          resHeaders['content-type'] = 'application/json';
        }
        resolve({
          statusCode: resStatusCode,
          headers: resHeaders,
          body: resBody,
          isBase64Encoded: false,
        });
      },
      sendStatus(code) {
        resStatusCode = code;
        resolve({
          statusCode: code,
          headers: resHeaders,
          body: '',
          isBase64Encoded: false,
        });
      },
    };

    app(reqStream, res, () => {
      resolve({
        statusCode: 404,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' }),
        isBase64Encoded: false,
      });
    });
  });
};

export const config = {
  path: '/api/*',
};
