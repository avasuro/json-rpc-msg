((factory) => {
    // Define as CommonJS export:
    if (typeof require === 'function' && typeof exports === 'object') {
        module.exports = factory(); // eslint-disable-line
    }
    // Define as AMD:
    else if (typeof define === 'function' && define.amd) { // eslint-disable-line no-undef
        define([], factory); // eslint-disable-line no-undef
    }
    // Browser:
    else {
        window.JsonRPC = factory(); // eslint-disable-line no-undef
    }
})(() => {
    /**
     * List of errors
     *
     * @type {object}
     */
    const ERRORS = {
        // codes from -32000 to -32099 reserved for implementation-defined server-errors.
        INVALID_REQUEST: {
            code: -32600,
            message: 'Invalid request'
        },
        METHOD_NOT_FOUND: {
            code: -32601,
            message: 'Method not found'
        },
        INVALID_PARAMS: {
            code: -32602,
            message: 'Invalid params'
        },
        INTERNAL_ERROR: {
            code: -32603,
            message: 'Internal error'
        },
        PARSE_ERROR: {
            code: -32700,
            message: 'Parse error'
        }
    };

    /**
     * List of supported message types
     *
     * @type {object}
     */
    const MESSAGE_TYPES = {
        REQUEST: 'request',
        INTERNAL_REQUEST: 'internal_request',
        NOTIFICATION: 'notification',
        INTERNAL_NOTIFICATION: 'internal_notification',
        RESPONSE: 'response',
        ERROR: 'error',
        BATCH: 'batch'
    };

    /**
     * Contains prefix of name of all messages for internal usage
     *
     * @type {string}
     */
    const INTERNAL_MESSAGE_PREFIX = 'rpc.';

    /**
     * Constructor of error object, that should be thrown from "parse" method
     *
     * @param {object} error
     *
     * @constructor
     */
    function ParserError(error) {
        this.name = 'ParserError';
        this.message = 'Failed to parse JSON-RPC message';
        this.rpcError = error;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ParserError);
        }
        else {
            this.stack = (new Error()).stack;
        }
    }

    ParserError.prototype = Object.create(Error.prototype);
    ParserError.prototype.constructor = ParserError;

    /**
     * Utility function for assertion
     *
     * @param {boolean} condition
     * @param {string} errorText
     *
     * @returns {void}
     *
     * @throws Error if condition is falsy
     */
    function assert(condition, errorText) {
        if (!condition) {
            throw new Error(errorText);
        }
    }

    /**
     * Utility function to create basic JSON-RPC message
     *
     * @param {number|string|undefined} id?
     * @param {object} messageData?
     *
     * @returns {object}
     *
     * @private
     */
    function _createMessage(id, messageData = null) {
        if (id !== undefined && id !== null) {
            if (typeof id === 'string') {
                assert(id.length > 0, 'ID of message is not defined');
            }
            else {
                assert(Number.isInteger(id), `ID should be a string or an integer number, "${typeof id}" given`);
            }
        }

        const message = {
            jsonrpc: '2.0',
            ...messageData
        };

        if (id !== undefined) {
            message.id = id;
        }

        return message;
    }

    /**
     * Create a JSON-RPC request object ( https://www.jsonrpc.org/specification#request_object )
     *
     * @param {number|string|undefined} id
     * @param {string} method
     * @param {object|array|undefined} params
     * @param {boolean} isInternal
     *
     * @returns {object}
     *
     * @private
     */
    function _createRequestObject(id, method, params, isInternal) {
        assert(typeof method === 'string', 'Method should be a string');
        assert(method.trim().length > 0, 'Method name should not be empty');
        if (!isInternal) {
            assert(method.indexOf(INTERNAL_MESSAGE_PREFIX) !== 0, `Invalid method name "${method}": only internal methods can be prefixed with "${INTERNAL_MESSAGE_PREFIX}"`);
        }
        if (params !== undefined) {
            assert(
                Array.isArray(params) || (typeof params === 'object' && params !== null),
                `Request parameters must be a structured value (an array or an object), "${typeof params}" given`
            );
        }

        if (isInternal) {
            if (method.indexOf(INTERNAL_MESSAGE_PREFIX) !== 0) {
                method = `${INTERNAL_MESSAGE_PREFIX}${method}`;
            }
        }

        let messageData = {method};
        if (params) {
            messageData.params = params;
        }

        return _createMessage(id, messageData);
    }

    /**
     * Utility function to create JSON-RPC request
     *
     * @param {number|string} id
     * @param {string} method
     * @param {object|array|undefined} params
     * @param {boolean} isInternal
     *
     * @returns {object}
     *
     * @private
     */
    function _createRequest(id, method, params, isInternal) {
        assert(id !== undefined && id !== null, 'ID of request is not defined');
        return _createRequestObject(id, method, params, isInternal);
    }

    /**
     * Utility function to create JSON-RPC notification
     *
     * @param {string} method
     * @param {object|array|undefined} params
     * @param {boolean} isInternal
     *
     * @returns {object}
     *
     * @private
     */
    function _createNotification(method, params, isInternal) {
        return _createRequestObject(undefined, method, params, isInternal);
    }

    /**
     * Utility function to create JSON-RPC response
     *
     * @param {number|string} id
     * @param {object} responseData
     *
     * @returns {object}
     *
     * @private
     */
    function _createResponse(id, responseData) {
        assert(id !== undefined, 'ID of response is not defined');
        return _createMessage(id, responseData);
    }

    /**
     * Creates a response error object ( https://www.jsonrpc.org/specification#error_object )
     *
     * @param {Number|{code: int, message: string?}} errorData - error code
     * @param {object} additionalData? - error details
     *
     * @return {Object}
     */
    function _createErrorObject(errorData, additionalData) {
        if (Number.isInteger(errorData)) {
            errorData = {code: errorData};
        }
        assert(
            typeof errorData === 'object' && errorData !== null && !Array.isArray(errorData),
            'Error code should be an integer number or object with "code" and "message" property'
        );
        assert(errorData.message === undefined || typeof errorData.message === 'string', 'Error message should be a string');
        assert(Number.isInteger(errorData.code), 'Error code should be an integer value');
        if (additionalData !== undefined) {
            assert(
                Array.isArray(additionalData) || (typeof additionalData === 'object' && additionalData !== null),
                `Error details must be a structured value (an array or an object), "${typeof additionalData}" given`
            );
        }

        if (!errorData.message) {
            let errorInRegistry = Object.values(ERRORS).find(
                error => error.code === errorData.code
            );
            errorData.message = errorInRegistry ? errorInRegistry.message : 'Internal Server Error';
        }

        const errorObj = {...errorData};
        if (additionalData) {
            errorObj.data = additionalData;
        }

        return errorObj;
    }

    /**
     * Creates new JSON-RPC request
     *
     * @param {number|string} id
     * @param {string} method
     * @param {object|array|undefined} params
     *
     * @returns {object}
     */
    function createRequest(id, method, params) {
        return _createRequest(id, method, params, false);
    }

    /**
     * Creates new internal JSON-RPC request
     *
     * @param {number|string} id
     * @param {string} method
     * @param {object|array|undefined} params
     *
     * @returns {object}
     */
    function createInternalRequest(id, method, params) {
        return _createRequest(id, method, params, true);
    }

    /**
     * Creates new JSON-RPC notification
     *
     * @param {string} method
     * @param {object|array|undefined} params
     *
     * @returns {object}
     */
    function createNotification(method, params) {
        return _createNotification(method, params, false);
    }

    /**
     * Creates new internal JSON-RPC notification
     *
     * @param {string} method
     * @param {object|array|undefined} params
     *
     * @returns {object}
     */
    function createInternalNotification(method, params) {
        return _createNotification(method, params, true);
    }

    /**
     * Creates JSON-RPC response
     *
     * @param {number|string} id
     * @param {*} result
     *
     * @returns {object}
     *
     * @private
     */
    function createResponse(id, result) {
        assert(id !== undefined && id !== null, 'Response ID is not defined');
        assert(result !== undefined, 'Response result is not defined');
        return _createResponse(id, {result});
    }

    /**
     * Creates JSON-RPC response with error
     *
     * @param {number|string} id
     * @param {number|{code: number, message: string?}} errorCode
     * @param {object} details?
     *
     * @returns {object}
     */
    function createError(id, errorCode, details) {
        return _createResponse(id, {error: _createErrorObject(errorCode, details)});
    }

    /**
     * Parses passed message
     *
     * @param {string|object|array} message - JSON string or object or array or requests (batch)
     *
     * @returns {Array|object}
     */
    function parseMessage(message) {
        let result;
        // Prase JSON string into object:
        if (typeof message === 'string') {
            try {
                message = JSON.parse(message);
            }
            catch (e) {
                throw new ParserError(createError(null, ERRORS.PARSE_ERROR));
            }
        }


        // If message is an array then it's a batch, so we need to parse every request in this
        // batch separately
        // (unless we already parsing a batch - in that case parse error should be returned):
        if (Array.isArray(message)) {
            if (message.length === 0) {
                throw new ParserError(createError(null, ERRORS.INVALID_REQUEST));
            }
            result = {
                type: MESSAGE_TYPES.BATCH,
                payload: message.map((request) => {
                    let msg;
                    try {
                        msg = parseMessage(request, false);
                    }
                    catch (e) {
                        if (e instanceof ParserError) {
                            msg = e;
                        }
                    }
                    return msg;
                })
            };
        }
        // If message is normal js object, so we need to validate it and determine it's type:
        else if (typeof message === 'object') {
            // The only supported version is JSON-RPC 2.0:
            if (message.jsonrpc !== '2.0') {
                let id = message.id || null;
                throw new ParserError(createError(id, ERRORS.INTERNAL_ERROR));
            }
            if (message.method) {
                if (message.hasOwnProperty('params')) {
                    if (typeof message.params !== 'object' || message.params === null) {
                        throw new ParserError(
                            createError(message.id || null, ERRORS.INVALID_PARAMS)
                        );
                    }
                }

                if (message.id) {
                    result = {
                        type: message.method.indexOf(INTERNAL_MESSAGE_PREFIX) === 0
                            ? MESSAGE_TYPES.INTERNAL_REQUEST
                            : MESSAGE_TYPES.REQUEST,
                        payload: {
                            id: message.id,
                            method: message.method,
                            params: message.params
                        }
                    };
                }
                else {
                    result = {
                        type: message.method.indexOf(INTERNAL_MESSAGE_PREFIX) === 0
                            ? MESSAGE_TYPES.INTERNAL_NOTIFICATION
                            : MESSAGE_TYPES.NOTIFICATION,
                        payload: {
                            method: message.method,
                            params: message.params
                        }
                    };
                }
            }
            else {
                if (!message.id) {
                    throw new ParserError(createError(null, ERRORS.INVALID_REQUEST));
                }

                if (
                    (message.result && message.error) ||
                    (!message.result && !message.error)
                ) {
                    throw new ParserError(createError(message.id, ERRORS.INVALID_REQUEST));
                }
                else if (message.result) {
                    result = {
                        type: MESSAGE_TYPES.RESPONSE,
                        payload: {
                            id: message.id,
                            result: message.result
                        }
                    };
                }
                else {
                    result = {
                        type: MESSAGE_TYPES.ERROR,
                        payload: {
                            id: message.id,
                            error: message.error
                        }
                    };
                }
            }
        }
        // If message is not an array and is not an object - it is invalid, so return an error:
        else {
            throw new ParserError(createError(null, ERRORS.INVALID_REQUEST));
        }

        return result;
    }

    return {
        ERRORS,
        MESSAGE_TYPES,
        INTERNAL_MESSAGE_PREFIX,
        ParserError,
        createRequest,
        createInternalRequest,
        createNotification,
        createInternalNotification,
        createResponse,
        createError,
        parseMessage
    };
});
