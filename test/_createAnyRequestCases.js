const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;

module.exports = ({
    RPC_VERSION,
    createRequestWithId,
    createRequestWithMethodName,
    createRequestWithParameters
}) => {
    it('Returns valid request object', () => {
        let requestId = 1;
        let requestMethod = 'method_to_call';
        let requestParams = {a: 'a'};
        const result = JsonRPC.createRequest(1, 'method_to_call', requestParams);
        expect(result).to.be.an('object');
        expect(result).to.have.property('jsonrpc', RPC_VERSION);
        expect(result).to.have.property('id', requestId);
        expect(result).to.have.property('method', requestMethod);
        expect(result).to.have.property('params', requestParams);
    });

    it('Allows to create request without params', () => {
        const emptyParams = [undefined, null];
        emptyParams.forEach((param) => {
            let requestId = 1;
            let requestMethod = 'method_to_call';
            const result = JsonRPC.createRequest(1, 'method_to_call', param);
            expect(result).to.be.an('object');
            expect(result).to.have.property('jsonrpc', RPC_VERSION);
            expect(result).to.have.property('id', requestId);
            expect(result).to.have.property('method', requestMethod);
            expect(result).to.not.have.property('params');
        });
    });

    it('Allows to set request ID as string or number', () => {
        expect(createRequestWithId('123')).to.not.throw(Error);
        expect(createRequestWithId(123)).to.not.throw(Error);
    });

    it('Throws an error if request ID is not defined', () => {
        expect(createRequestWithId(undefined)).to.throw(Error);
        expect(createRequestWithId(null)).to.throw(Error);
        expect(createRequestWithId('')).to.throw(Error);
    });

    it('Throws an error if request ID is a fractional number', () => {
        expect(createRequestWithId(1.2)).to.throw(Error);
    });

    it('Throws an error if request ID have incorrect type', () => {
        expect(createRequestWithId(true)).to.throw(Error);
        expect(createRequestWithId(false)).to.throw(Error);
        expect(createRequestWithId({})).to.throw(Error);
        expect(createRequestWithId([])).to.throw(Error);
    });

    it('Throws an error if requested method name is not defined', () => {
        expect(createRequestWithMethodName(undefined)).to.throw(Error);
        expect(createRequestWithMethodName(null)).to.throw(Error);
        expect(createRequestWithMethodName('')).to.throw(Error);
        expect(createRequestWithMethodName('   ')).to.throw(Error);
    });

    it('Throws an error if requested method name have incorrect type', () => {
        expect(createRequestWithMethodName(0)).to.throw(Error);
        expect(createRequestWithMethodName(1)).to.throw(Error);
        expect(createRequestWithMethodName(true)).to.throw(Error);
        expect(createRequestWithMethodName(false)).to.throw(Error);
        expect(createRequestWithMethodName({})).to.throw(Error);
        expect(createRequestWithMethodName([])).to.throw(Error);
    });

    it('Accepts method parameters as an array or an object', () => {
        expect(createRequestWithParameters({})).to.not.throw(Error);
        expect(createRequestWithParameters([])).to.not.throw(Error);
    });

    it('Throws an error if method parameters have incorrect type', () => {
        expect(createRequestWithParameters(0)).to.throw(Error);
        expect(createRequestWithParameters(1)).to.throw(Error);
        expect(createRequestWithParameters('')).to.throw(Error);
        expect(createRequestWithParameters('   ')).to.throw(Error);
        expect(createRequestWithParameters('bad_params')).to.throw(Error);
        expect(createRequestWithParameters(true)).to.throw(Error);
        expect(createRequestWithParameters(false)).to.throw(Error);
    });
};
