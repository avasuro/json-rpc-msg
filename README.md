<div align="center">  
  <a href="https://github.com/avasuro/json-rpc-msg">  
     <p>JSON-RPC MSG</p>
  </a> 
  <p>  
    Zero-dependencies library for <a href="http://nodejs.org">Node.js</a> and <a href="https://en.wikipedia.org/wiki/JavaScript">JavaScript</a> to parse and create <a href="https://www.jsonrpc.org/specification">JSON RPC 2.0</a> messages.
  </p>
  <a href="https://img.shields.io/node/v/json-rpc-msg.svg?style=flat-square">
      <img alt="undefined" src="https://img.shields.io/node/v/json-rpc-msg.svg?style=flat-square">
  </a>
  <a href="https://img.shields.io/coveralls/github/avasuro/json-rpc-msg.svg?style=flat-square">
    <img alt="undefined" src="https://img.shields.io/coveralls/github/avasuro/json-rpc-msg.svg?style=flat-square">
  </a>
  <a href="https://img.shields.io/bundlephobia/min/json-rpc-msg.svg?style=flat-square">
      <img alt="undefined" src="https://img.shields.io/bundlephobia/min/json-rpc-msg.svg?style=flat-square">
    </a>
  <a href="https://img.shields.io/github/license/avasuro/json-rpc-msg.svg?style=flat-square">
    <img alt="undefined" src="https://img.shields.io/github/license/avasuro/json-rpc-msg.svg?style=flat-square">
  </a>
</div>

## About  
  
The **json-rpc-msg** is a library with zero dependencies that provides an API to parse and create valid JSON-RPC 2.0 messages.  
  
## Quick start  
  
Install:  
```
npm install --save json-rpc-msg 
```  

Usage:

```javascript
const JsonRPC = require('json-rpc-msg');

function sendMessageToClient(message) {
    // Some code that sends passed message to clients, e.g. over HTTP or websocket
}

/*--------------------------------------
 | Create JSON-RPC request
 |--------------------------------------
 |*/
const requestObj = JsonRPC.createRequest(123, 'updateUser', {id: 1, name: 'Alex'});
sendMessageToClient(requestObj);
// {
//   jsonrpc: '2.0',
//   id: 123,
//   method: 'updateUser',
//   params: {id: 1, name: 'Alex'}
// }

/*--------------------------------------
 | Parse JSON-RPC message 
 |--------------------------------------
 |*/
try {
    // Valid message:
    const message = JsonRPC.parseMessage('{"jsonrpc": "2.0", "id": 123, "method": "update", "params": [1,2,3]}');
    // {
    //     type: 'request',
    //     payload: {
    //         id: 123,
    //         method: 'update',
    //         params: [1,2,3]
    //     }
    // }
    
    
    // Invalid message (ParserError will be thrown):
    const failedMessage = JsonRPC.parseMessage('not valid JSON RPC message');
}
catch(e) {
    // If parser failed to parse message - send error to client:
    if (e instanceof JsonRPC.ParserError) {
        sendMessageToClient(e.rpcError);
    }
    // Otherwise throw error up:
    else {
        throw e;
    }
}
```

## API Reference

### Constants

#### ERRORS

Contains list of JSON-RPC error codes. Map with the following structure:
```javascript
JsonRPC.ERRORS = {
    SOME_ERROR: {
        code: 123,
        message: 'Some message for error'
    }
}
```

Can be used to manually create response with JSON-RPC error:
```javascript
// Create "Method not found" error for received request with ID=123
const errorObj = JsonRPC.createError(123, JsonRPC.ERRORS.METHOD_NOT_FOUND);
// {
//   jsonrpc: '2.0',
//   id: 123,
//   error: {
//     code: -32601,
//     message: 'Method not found'
//   }
// }
```

Some particular implementations of JSON-RPC protocol may want to add additional custom errors to
this object (note that errors from -32768 to 32000 are reserved for future use, for more information
see [specification to error object in JSON-RPC v2.0](https://www.jsonrpc.org/specification#error_object)):
```javascript
JsonRPC.ERRORS.NEW_ERROR_FOR_SOME_IMPLEMENTATION = {
    code: -32000,
    message: 'Message of added error'
}
const message = JsonRPC.createError(123, JsonRPC.ERRORS.NEW_ERROR_FOR_SOME_IMPLEMENTATION);
// {
//   jsonrpc: '2.0',
//   id: 123,
//   error: {
//     code: -32000,
//     message: 'Message of added error'
//   }
// }
```

#### MESSAGE_TYPES

Contains list of supported message types.

- **REQUEST** - message with "id" and "method" props (and optional "params")
- **INTERNAL_REQUEST** - the same as **REQUEST**, but only if "method" starts with "rpc.". This type of request is only for rpc-internal methods and extensions.
- **NOTIFICATION** - message without "id", and with "method" prop (and optional "params")
- **INTERNAL_NOTIFICATION** - the same as **NOTIFICATION**, but only if "method" starts with "rpc.". This type of notification is only for rpc-internal notifications and extensions.
- **RESPONSE** - message with "id" and "result" props. Represents response from server.
- **ERROR** - message with "id" and "error" props. Represents response from server with error.
- **BATCH** - message that is a group of JSON-RPC messages (array).

This constant should be mainly used to check type of parsed message:
```javascript
const receivedJSON = '{"jsonrpc": "2.0", "id": 1, "method": "log", "params": ["Some string to log"]}';
const message = JsonRPC.parseMessage(receivedJSON);
switch (message.type) {
    case JsonRPC.MESSAGE_TYPES.REQUEST:
        // Do something with request
        break;
    case JsonRPC.MESSAGE_TYPES.NOTIFICATION:
        // Do something with notification
        break;
    // ...etc
}
```

#### INTERNAL_MESSAGE_PREFIX

Contains string ("rpc."), that should be added to start of any message/notification that is intended for
internal usage of some particular JSON-RPC implementation. e.g:
```javascript
// Creates notification with name "rpc.someNotification":
const notificationJson = JsonRPC.createInternalNotification(`${JsonRPC.INTERNAL_MESSAGE_PREFIX}someNotification`);

// Because "createInternalNotification" adds this prefix automatically - the following code will
// produce the same result:
const notificationJson2 = JsonRPC.createInternalNotification('someNotification');

console.log(notificationJson === notificationJson2); // => true
```
### Methods

#### createRequest(id, method \[,params])

Creates JSON-RPC request

NOTE: If method name starts with "rpc." error will be thrown. To create requests for "rpc." methods use [createInternalRequest](#createInternalRequest) function instead.

- ``id`` {string|number}: request ID
- ``method`` {string}: method name to call
- ``params`` {Object|Array} _(optional)_: parameters to pass in method

```javascript
const requestObj = JsonRPC.createRequest(123, 'refreshAllUsers')
// {
//   jsonrpc: '2.0',
//   id: 123,
//   method: 'refreshAllUsers',
// }
```

```javascript
const requestObj = JsonRPC.createRequest(123, 'updateUser', {id: 1, name: 'Alex'})
// {
//   jsonrpc: '2.0',
//   id: 123,
//   method: 'updateUser',
//   params: {id: 1, name: 'Alex'}
// }
```

#### createNotification(method, \[,params])

Creates JSON-RPC notification

NOTE: If notification name starts with "rpc." error will be thrown. To create requests for "rpc." notifications use [createInternalNotification](#createInternalNotification) function instead.

- ``method`` {string}: method name to call
- ``params`` {Object|Array} _(optional)_: parameters to pass in method

```javascript
const notificationObj = JsonRPC.createNotification('allUsersWereRefreshed')
// {
//   jsonrpc: '2.0',
//   method: 'allUsersWereRefreshed'
// }
```

```javascript
const notificationObj = JsonRPC.createNotification('userUpdated', {id: 1, name: 'Alex'})
// {
//   jsonrpc: '2.0',
//   method: 'userUpdated',
//   params: {id: 1, name: 'Alex'}
// }
```

#### createResponse(id, result)

Creates successfull JSON-RPC response to some request

- ``id`` {string|number}: request ID
- ``result`` {Mixed}: response data

```javascript
const responseObj = JsonRPC.createResponse(123, {id: 1, name: 'Alex', age: 23})
// {
//   jsonrpc: '2.0',
//   id: 123,
//   response: {id: 1, name: 'Alex', age: 23}
// }
```

```javascript
const responseObj = JsonRPC.createResponse(123, null)
// {
//   jsonrpc: '2.0',
//   id: 123,
//   response: null 
// }
```

#### createError(id, error, \[, additionalErrorData])

Creates JSON-RPC response with error 

- ``id`` {string|number}: request ID
- ``error`` {number|{code: number, message: string?}}: error code (number) or object with "code" and optional "message" property
- ``additionalErrorData`` {Object|Array}: additional data for error

```javascript
// All of the following statements will produce same result:
const errorResponseObj = JsonRPC.createError(123, -32602);
const errorResponseObj = JsonRPC.createError(123, JsonRPC.ERRORS.INVALID_PARAMS);
const errorResponseObj = JsonRPC.createError(123, {code: -32602});
const errorResponseObj = JsonRPC.createError(123, {code: -32602, message: 'Invalid params'});
// {
//   jsonrpc: '2.0',
//   id: 123,
//   error: {
//     code: -32602,
//     message: 'Invalid params'
//   }
// }
```

There is ability to provide additional information for error, passing _additionalParams_ argument,
e.g. if invalid user name and age where passed in request:
```javascript
const errorResponseObj = JsonRPC.createError(123, JsonRPC.ERRORS.INVALID_PARAMS, {
    name: "User name can't be less then 6 characters",
    age: "User age is not defined"
});
// {
//   jsonrpc: '2.0',
//   id: 123,
//   error: {
//     code: -32602,
//     message: 'Invalid params',
//     data: {
//         name: 'User name can't be less then 6 characters',
//         age: 'User age is not defined'
//     }
//   }
// }
```

If ``error`` passed as object with property "code" but without property "message" this method will
look at JsonRPC.ERRORS to find error with given code, and find appropriate message. If there is no
error with given code in ERRORS - message will be defaulted to "Internal Server Error":
```javascript
JsonRPC.ERRORS.NEW_ERROR = {
    code: 666,
    message: 'Number of the Beast'
}

// Message will be taken from ERRORS object:
const errorResponseObj = JsonRPC.createError(123, {code: 666});
// {
//   jsonrpc: '2.0',
//   id: 123,
//   error: {
//     code: 666,
//     message: 'Number of the Beast'
// }

// Message in ERRORS object will not be used because "message" is provided:
const errorResponseObj = JsonRPC.createError(123, {code: 666, message: 'replaced message'});
// {
//   jsonrpc: '2.0',
//   id: 123,
//   error: {
//     code: 666,
//     message: 'replaced message'
// }

// Error that is not in ERRORS object will have default "Internal Serve Error" message:
const errorResponseObj = JsonRPC.createError(123, {code: 999});
// {
//   jsonrpc: '2.0',
//   id: 123,
//   error: {
//     code: 999,
//     message: 'Internal Server Error'
// }
```

#### parseMessage(message)

Validates and parses given JSON-RPC message

- ``message`` {string|Object|array} - JSON string or message object or batch of messages (array)

Returns object with properties "type" and "payload". Type can be one of
the types listed in JsonRPC.MESSAGE_TYPES constant. Payload will contain message body, which depends
on message type:
- **REQUEST** and **INTERNAL_REQUEST** will contain "id", "method" and optional "params" properties:
    ```javascript
    const message = JsonRPC.parseMessage('{"jsonrpc": "2.0", "id": 123, "method": "update", "params": [1,2,3]}');
    // {
    //     type: 'request',
    //     payload: {
    //         id: 123,
    //         method: 'update',
    //         params: [1,2,3]
    //     }
    // }
    ```
- **NOTIFICATION** and **INTERNAL_NOTIFICATION** will contain "method" and optional "params" properties:
    ```javascript
    const message = JsonRPC.parseMessage('{"jsonrpc": "2.0", "method": "updated", "params": [1,2,3]}');
    // {
    //     type: 'notification',
    //     payload: {
    //         method: 'updated',
    //         params: [1,2,3]
    //     }
    // }
    ```
- **RESPONSE** will contain "id" and "result" properties:
    ```javascript
    const message = JsonRPC.parseMessage('{"jsonrpc": "2.0", "id": 1, "result": [1,2,3]}');
    // {
    //     type: 'response',
    //     payload: {
    //         id: 1,
    //         result: [1,2,3]
    //     }
    // }
    ```
- **ERROR** will contain "id" and "error" properties:
    ```javascript
    const message = JsonRPC.parseMessage('{"jsonrpc": "2.0", "id": 1, "error": {"code": -32602, "message": "Invalid params", "data": [1,2,3]}}');
    // {
    //     type: 'error',
    //     payload: {
    //         id: 1,
    //         error: {
    //             code: -32602,
    //             message: 'Invalid params',
    //             data: [1,2,3] 
    //         }
    //     }
    // }
    ```
- **BATCH** will contain array of parsed messages in "payload" property. If some of this messages failed to be parsed - there will be an error in this array instead of parsed message:
    ```javascript
    const message = JsonRPC.parseMessage('['+
        '{"jsonrpc": "2.0", "id": 1, "result": "OK"}' +
        '{"jsonrpc": "2.0", "id": 1, "error": {"code": -32602, "message": "Invalid params", "data": [1,2,3]}}]' +
        'invalid JSON-RPC message' +
    ']');
    // {
    //   type: 'batch',
    //   payload: [
    //     {
    //       type: 'response',
    //       payload: {
    //         id: 1,
    //           result: [1,2,3]
    //       }
    //     },
    //     {
    //       type: 'error',
    //       payload: {
    //         id: 1,
    //         error: {
    //           code: -32602,
    //           message: 'Invalid params',
    //           data: [1,2,3] 
    //         }
    //       },
    //     },
    //     [ParserError Object]
    //   ] 
    // }
    ```

#### createInternalRequest

The same as [createRequest](#createRequest), but allows to create requests with method name
that starts with "rpc." prefix. If this prefix is not presented in method name it will be
added automatically.

#### createInternalNotification

The same as [createNotification](#createNotification), but allows to create notification with name
that starts with "rpc." prefix. If this prefix is not presented in name it will be
added automatically.

## License  
  
  [MIT](LICENSE)