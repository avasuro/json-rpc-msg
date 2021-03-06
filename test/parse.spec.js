const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;

const RPC_VERSION = process.env.RPC_VERSION;

describe('#parseMessage', () => {
    const notificationExample = {
        data: {
            jsonrpc: '2.0',
            method: 'someEvent',
            params: ['eventData']
        },
        test(result) {
            expect(result).to.have.property('type', JsonRPC.MESSAGE_TYPES.NOTIFICATION);
            expect(result).to.have.deep.property('payload', {
                method: notificationExample.data.method,
                params: notificationExample.data.params
            });
        }
    };
    const internalNotificationExample = {
        data: {
            jsonrpc: '2.0',
            method: 'rpc.someEvent',
            params: ['eventData']
        },
        test(result) {
            expect(result).to.have.property('type', JsonRPC.MESSAGE_TYPES.INTERNAL_NOTIFICATION);
            expect(result).to.have.deep.property('payload', {
                method: internalNotificationExample.data.method,
                params: internalNotificationExample.data.params
            });
        }
    };
    const requestExample = {
        data: {
            jsonrpc: '2.0',
            id: 1,
            method: 'test',
            params: [1, 2]
        },
        test(result) {
            expect(result).to.have.property('type', JsonRPC.MESSAGE_TYPES.REQUEST);
            expect(result).to.have.deep.property('payload', {
                id: requestExample.data.id,
                method: requestExample.data.method,
                params: requestExample.data.params
            });
        }
    };
    const internalRequestExample = {
        data: {
            jsonrpc: '2.0',
            id: 1,
            method: 'rpc.test',
            params: [1, 2]
        },
        test(result) {
            expect(result).to.have.property('type', JsonRPC.MESSAGE_TYPES.INTERNAL_REQUEST);
            expect(result).to.have.deep.property('payload', {
                id: internalRequestExample.data.id,
                method: internalRequestExample.data.method,
                params: internalRequestExample.data.params
            });
        }
    };
    const responseExample = {
        data: {
            jsonrpc: '2.0',
            id: 1,
            result: 'some_result'
        },
        test(result) {
            expect(result).to.have.property('type', JsonRPC.MESSAGE_TYPES.RESPONSE);
            expect(result).to.have.deep.property('payload', {
                id: responseExample.data.id,
                result: responseExample.data.result
            });
        }
    };
    const errorExample = {
        data: {
            jsonrpc: '2.0',
            id: 1,
            error: {
                code: JsonRPC.ERRORS.INTERNAL_ERROR.code,
                message: JsonRPC.ERRORS.INTERNAL_ERROR.message,
                data: {
                    additionalInfo: 'some info about error'
                }
            }
        },
        test(result) {
            expect(result).to.have.property('type', JsonRPC.MESSAGE_TYPES.ERROR);
            expect(result).to.have.deep.property('payload', {
                id: errorExample.data.id,
                error: errorExample.data.error
            });
        }
    };

    it('Successfully parses notifications represented as javascript object', () => {
        notificationExample.test(JsonRPC.parseMessage(notificationExample.data));
    });

    it('Successfully parses internal notifications represented as javascript object', () => {
        internalNotificationExample.test(JsonRPC.parseMessage(internalNotificationExample.data));
    });

    it('Successfully parses requests represented as javascript object', () => {
        requestExample.test(JsonRPC.parseMessage(requestExample.data));
    });

    it('Successfully parses internal requests represented as javascript object', () => {
        internalRequestExample.test(JsonRPC.parseMessage(internalRequestExample.data));
    });

    it('Successfully parses responses represented as javascript object', () => {
        responseExample.test(JsonRPC.parseMessage(responseExample.data));
    });

    it('Successfully parses errors represented as javascript object', () => {
        errorExample.test(JsonRPC.parseMessage(errorExample.data));
    });

    it('Successfully parses messages represented as javascript array (batches)', () => {
        const batchParts = [notificationExample, requestExample, responseExample, errorExample];
        const batch = batchParts.map(batchPart => batchPart.data);
        const result = JsonRPC.parseMessage(batch);
        expect(result).to.be.an('object');
        expect(result).to.have.property('type', JsonRPC.MESSAGE_TYPES.BATCH);
        expect(result).to.have.property('payload');
        expect(result.payload).to.be.an('array').with.length(batch.length);
        result.payload.forEach((parsedMessage, i) => batchParts[i].test(parsedMessage));
    });

    it('Successfully parses messages represented as JSON string', () => {
        notificationExample.test(JsonRPC.parseMessage(JSON.stringify(notificationExample.data)));
    });

    it('Throws "Parse error" if invalid JSON passed', () => {
        expect(() => JsonRPC.parseMessage('test'))
            .to.throw(JsonRPC.ParserError)
            .with.deep.property('rpcError', {
                jsonrpc: RPC_VERSION,
                id: null,
                error: {
                    code: JsonRPC.ERRORS.PARSE_ERROR.code,
                    message: JsonRPC.ERRORS.PARSE_ERROR.message
                }
            });
    });

    it('Returns array that contains parse errors if JSON batch with bad formed requests passed', () => {
        const result = JsonRPC.parseMessage(['test']);
        expect(result).to.be.an('object');
        expect(result).to.have.property('type', JsonRPC.MESSAGE_TYPES.BATCH);
        expect(result).to.have.property('payload')
            .that.is.an('array')
            .that.have.property('0')
            .that.is.instanceof(JsonRPC.ParserError);
    });

    it('Throws "Invalid request" if passed batch is empty', () => {
        expect(() => JsonRPC.parseMessage([]))
            .to.throw(JsonRPC.ParserError)
            .with.deep.property('rpcError', {
                jsonrpc: RPC_VERSION,
                id: null,
                error: {
                    code: JsonRPC.ERRORS.INVALID_REQUEST.code,
                    message: JsonRPC.ERRORS.INVALID_REQUEST.message
                }
            });
    });

    it('Throws "Invalid request" if passed JSON is not an array or an object', () => {
        expect(() => JsonRPC.parseMessage(true))
            .to.throw(JsonRPC.ParserError)
            .with.deep.property('rpcError', {
                jsonrpc: RPC_VERSION,
                id: null,
                error: {
                    code: JsonRPC.ERRORS.INVALID_REQUEST.code,
                    message: JsonRPC.ERRORS.INVALID_REQUEST.message
                }
            });
    });

    it('Throws "Invalid request" if response have both "result" and "error" props at the same time', () => {
        const response = {
            jsonrpc: '2.0',
            id: 1,
            result: 'test',
            error: {
                code: JsonRPC.ERRORS.PARSE_ERROR.code,
                message: JsonRPC.ERRORS.PARSE_ERROR.message
            }
        };
        expect(() => JsonRPC.parseMessage(response))
            .to.throw(JsonRPC.ParserError)
            .with.deep.property('rpcError', {
                jsonrpc: RPC_VERSION,
                id: 1,
                error: {
                    code: JsonRPC.ERRORS.INVALID_REQUEST.code,
                    message: JsonRPC.ERRORS.INVALID_REQUEST.message
                }
            });
    });

    it('Throws "Invalid request" if response have no "result" or "error" props', () => {
        const response = {
            jsonrpc: '2.0',
            id: 1
        };
        expect(() => JsonRPC.parseMessage(response))
            .to.throw(JsonRPC.ParserError)
            .with.deep.property('rpcError', {
                jsonrpc: RPC_VERSION,
                id: 1,
                error: {
                    code: JsonRPC.ERRORS.INVALID_REQUEST.code,
                    message: JsonRPC.ERRORS.INVALID_REQUEST.message
                }
            });
    });

    it('Throws "Invalid request" if response have no ID specified', () => {
        const response = {
            jsonrpc: '2.0',
            result: 'test'
        };
        expect(() => JsonRPC.parseMessage(response))
            .to.throw(JsonRPC.ParserError)
            .with.deep.property('rpcError', {
                jsonrpc: RPC_VERSION,
                id: null,
                error: {
                    code: JsonRPC.ERRORS.INVALID_REQUEST.code,
                    message: JsonRPC.ERRORS.INVALID_REQUEST.message
                }
            });
    });

    it('Throws "Internal error" if JSON-RPC version passed in JSON is not supported', () => {
        const response = {
            id: 1,
            result: 'test'
        };
        expect(() => JsonRPC.parseMessage(response))
            .to.throw(JsonRPC.ParserError)
            .with.deep.property('rpcError', {
                jsonrpc: RPC_VERSION,
                id: 1,
                error: {
                    code: JsonRPC.ERRORS.INTERNAL_ERROR.code,
                    message: JsonRPC.ERRORS.INTERNAL_ERROR.message
                }
            });
    });

    it('Throws "Invalid request" if request parameters is not a structured value', () => {
        const invalidParams = [
            undefined,
            null,
            true,
            false,
            '',
            '   ',
            'abc',
            0,
            123
        ];
        invalidParams.forEach((param) => {
            const message = {
                jsonrpc: '2.0',
                id: 1,
                method: 'wrongParamsTest',
                params: param
            };
            expect(() => JsonRPC.parseMessage(message))
                .to.throw(JsonRPC.ParserError)
                .with.deep.property('rpcError', {
                    jsonrpc: RPC_VERSION,
                    id: 1,
                    error: {
                        code: JsonRPC.ERRORS.INVALID_REQUEST.code,
                        message: JsonRPC.ERRORS.INVALID_REQUEST.message
                    }
                });
        });
    });

    it('Throws "Invalid request" if request method name is not a string', () => {
        const invalidMethodNames = [
            undefined,
            null,
            true,
            false,
            '',
            '   ',
            0,
            123,
            [],
            [1, 2, 3],
            {},
            {a: 'a'}
        ];
        invalidMethodNames.forEach((methodName) => {
            const message = {
                jsonrpc: '2.0',
                id: 1,
                method: methodName
            };
            expect(() => JsonRPC.parseMessage(message))
                .to.throw(JsonRPC.ParserError)
                .with.deep.property('rpcError', {
                    jsonrpc: RPC_VERSION,
                    id: 1,
                    error: {
                        code: JsonRPC.ERRORS.INVALID_REQUEST.code,
                        message: JsonRPC.ERRORS.INVALID_REQUEST.message
                    }
                });
        });
    });


    it('Allows to pass method or notification params as object or array', () => {
        const validParams = [
            [],
            [1, 2],
            {},
            {a: 'a'}
        ];
        validParams.forEach((param) => {
            const message = {
                jsonrpc: '2.0',
                method: 'validParamsTest',
                params: param
            };
            expect(() => JsonRPC.parseMessage(message)).to.not.throw(JsonRPC.ParserError);
        });
    });

    it('Throws ParserError if error message contains non-object "error" property', () => {
        const invalidErrorValues = [
            undefined,
            null,
            false,
            true,
            0,
            1,
            2.3,
            '',
            '  ',
            'abc',
            [],
            [1, 2]
        ];
        invalidErrorValues.forEach((invalidErrorValue) => {
            const message = {
                jsonrpc: '2.0',
                id: 1,
                error: invalidErrorValue
            };
            expect(() => JsonRPC.parseMessage(message)).to.throw(JsonRPC.ParserError);
        });
    });

    it('Throws ParserError if error message have invalid or missing "code" property', () => {
        const invalidCodeValues = [
            undefined,
            null,
            false,
            true,
            2.3,
            '',
            '  ',
            'abc',
            {},
            {a: 'a'},
            [],
            [1, 2]
        ];
        invalidCodeValues.forEach((invalidCode) => {
            const message = {
                jsonrpc: '2.0',
                id: 1,
                error: {
                    code: invalidCode,
                    message: 'test'
                }
            };
            expect(() => JsonRPC.parseMessage(message)).to.throw(JsonRPC.ParserError);
        });
    });

    it('Throws ParserError if error message have invalid or missing "message" property', () => {
        const invalidMessageValues = [
            undefined,
            null,
            false,
            true,
            2.3,
            {},
            {a: 'a'},
            [],
            [1, 2]
        ];
        invalidMessageValues.forEach((invalidMessage) => {
            const message = {
                jsonrpc: '2.0',
                id: 1,
                error: {
                    code: 123,
                    message: invalidMessage
                }
            };
            expect(() => JsonRPC.parseMessage(message)).to.throw(JsonRPC.ParserError);
        });
    });
});
