const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;

const RPC_VERSION = process.env.RPC_VERSION;

describe('#createError', () => {
    function createErrorWithCode(error) {
        return () => JsonRPC.createError(1, error);
    }

    function createErrorWithId(id) {
        return () => JsonRPC.createError(id, 123);
    }

    function createErrorWithAdditionalData(data) {
        return () => JsonRPC.createError(1, 123, data);
    }

    it('Returns valid error object', () => {
        function testError(code, additionalData) {
            const requestId = 1;
            const result = JsonRPC.createError(requestId, code, additionalData);
            expect(result).to.be.an('object');
            expect(result).to.have.property('jsonrpc', RPC_VERSION);
            expect(result).to.have.property('id', requestId);
            expect(result).to.have.deep.property('error', {
                code: 123,
                message: 'Internal Server Error',
                data: additionalData
            });
            expect(result).to.not.have.property('result');
        }
        testError(123, {someData: 'test'});
    });

    it('Allows to set request ID as null, string or number', () => {
        expect(createErrorWithId(null)).to.not.throw(Error);
        expect(createErrorWithId('123')).to.not.throw(Error);
        expect(createErrorWithId(123)).to.not.throw(Error);
    });

    it('Throws an error if request ID is not defined', () => {
        expect(createErrorWithId(undefined)).to.throw(Error);
        expect(createErrorWithId('')).to.throw(Error);
    });

    it('Throws an error if request ID have incorrect type', () => {
        expect(createErrorWithId(1.2)).to.throw(Error);
        expect(createErrorWithId(true)).to.throw(Error);
        expect(createErrorWithId(false)).to.throw(Error);
        expect(createErrorWithId({})).to.throw(Error);
        expect(createErrorWithId([])).to.throw(Error);
    });

    it('Allows to set error code as integer number', () => {
        expect(createErrorWithCode(123)).to.not.throw(Error);
        expect(createErrorWithCode(0)).to.not.throw(Error);
    });

    it('Allows to pass error code as object, with "code" and optional "message" property', () => {
        expect(createErrorWithCode({code: 123, message: 'Some custom error'})).to.not.throw(Error);
        expect(createErrorWithCode({code: JsonRPC.ERRORS.INTERNAL_ERROR.code})).to.not.throw(Error);
        expect(createErrorWithCode(JsonRPC.ERRORS.INTERNAL_ERROR)).to.not.throw(Error);
    });

    it('Throws an error if error code is not passed', () => {
        expect(createErrorWithCode(undefined)).to.throw(Error);
        expect(createErrorWithCode(null)).to.throw(Error);
        expect(createErrorWithCode('')).to.throw(Error);
        expect(createErrorWithCode({message: 'Some custom error'})).to.throw(Error);
        expect(createErrorWithCode({})).to.throw(Error);
    });

    it('Throws an error if error code has invalid type', () => {
        expect(createErrorWithCode('123')).to.throw(Error);
        expect(createErrorWithCode(true)).to.throw(Error);
        expect(createErrorWithCode(false)).to.throw(Error);
        expect(createErrorWithCode([])).to.throw(Error);
        expect(createErrorWithCode(123.456)).to.throw(Error);
        expect(createErrorWithCode({code: '123'})).to.throw(Error);
        expect(createErrorWithCode({code: '123', message: 'test'})).to.throw(Error);
    });

    it('Allows to set additional error data as Structured Value (array or object) or as Primitive', () => {
        expect(createErrorWithAdditionalData([])).to.not.throw(Error);
        expect(createErrorWithAdditionalData({})).to.not.throw(Error);
        expect(createErrorWithAdditionalData(0)).to.not.throw(Error);
        expect(createErrorWithAdditionalData(1)).to.not.throw(Error);
        expect(createErrorWithAdditionalData(1.25)).to.not.throw(Error);
        expect(createErrorWithAdditionalData(false)).to.not.throw(Error);
        expect(createErrorWithAdditionalData(true)).to.not.throw(Error);
        expect(createErrorWithAdditionalData('123')).to.not.throw(Error);
        expect(createErrorWithAdditionalData('')).to.not.throw(Error);
    });

    it('Allows to skip additional error data', () => {
        expect(createErrorWithAdditionalData(undefined)).to.not.throw(Error);
        expect(createErrorWithAdditionalData(null)).to.not.throw(Error);
    });
});
