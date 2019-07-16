const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;

const RPC_VERSION = process.env.RPC_VERSION;

describe('#createResponse', () => {
    function createResponseWithResult(result) {
        return () => JsonRPC.createResponse(1, result);
    }

    function createResponseWithId(id) {
        return () => JsonRPC.createResponse(id, null);
    }

    it('Returns valid response object', () => {
        function testResponseWithData(data) {
            const requestId = 1;
            const result = JsonRPC.createResponse(requestId, data);
            expect(result).to.be.an('object');
            expect(result).to.have.property('jsonrpc', RPC_VERSION);
            expect(result).to.have.property('id', requestId);
            expect(result).to.have.property('result', data);
            expect(result).to.not.have.property('error');
        }
        testResponseWithData({a: 'a'});
        testResponseWithData([1, 2]);
        testResponseWithData(12);
        testResponseWithData(12.35);
        testResponseWithData('12.35');
    });

    it('Throws an error if response have no data set', () => {
        expect(createResponseWithResult(undefined)).to.throw(Error);
    });

    it('Allows to set empty response data (null, empty string, etc.)', () => {
        expect(createResponseWithResult(null)).to.not.throw(Error);
        expect(createResponseWithResult('')).to.not.throw(Error);
        expect(createResponseWithResult(0)).to.not.throw(Error);
        expect(createResponseWithResult(false)).to.not.throw(Error);
    });

    it('Allows to set response ID as string or number', () => {
        expect(createResponseWithId('123')).to.not.throw(Error);
        expect(createResponseWithId(123)).to.not.throw(Error);
    });

    it('Throws an error if response ID is not defined', () => {
        expect(createResponseWithId(undefined)).to.throw(Error);
        expect(createResponseWithId(null)).to.throw(Error);
        expect(createResponseWithId('')).to.throw(Error);
    });

    it('Throws an error if response ID is a fractional number', () => {
        expect(createResponseWithId(1.2)).to.throw(Error);
    });

    it('Throws an error if response ID have incorrect type', () => {
        expect(createResponseWithId(true)).to.throw(Error);
        expect(createResponseWithId(false)).to.throw(Error);
        expect(createResponseWithId({})).to.throw(Error);
        expect(createResponseWithId([])).to.throw(Error);
    });
});
