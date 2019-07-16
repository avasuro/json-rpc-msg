1.1.1 / 2019-07-16
==================
 - [dev] removed: package-lock.json and prevented from creating
 - [dev] updated: eslint config + fixed eslint errors
 - [dev] added: run code lint before commit
 - [added] changelog file
 
1.1.0 / 2019-01-16
==================
 - [fix] [#parseMessage] throws an error if empty batch passed (e.g. jsonrpc.parseMessage([]))
 - [fix] [#parseMessage] throws an error if request parameters have invalid type (any type, except "object")
 - [fix] [#parseMessage] throws an error if notification/request method is not defined of has invalid type (any type, except "string")
 - [added] [#parseMessage] validation of error object. Now if error have no code or message new ParserError will be thrown. Also this error will be thrown if code, message or error object itself has invalid type.
 - [fix] [#createRequest] Treat request parameters that equals to "null" as not defined
 - [fix] [#createInternalRequest] Treat request parameters that equals to "null" as not defined
 - [fix] [#createNotification] Treat request parameters that equals to "null" as not defined
 - [fix] [#createInternalNotification] Treat request parameters that equals to "null" as not defined
 - [improvement] [#createError] Additional error data now can be of any type
 - [fix] By a mistake ParserError was stored JSON-RPC encoded error inside errorData property. Now it's moved directly into error object.
 
 1.0.0 / 2019-01-15
 ==================
  - initial implementation