const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;
const testCreateAnyRequestCases = require('./_createAnyRequestCases');

const RPC_VERSION = process.env.RPC_VERSION;

describe('#createRequest', function() {
    function createRequestWithMethodName(name) {
        return () => JsonRPC.createRequest(1, name);
    }

    testCreateAnyRequestCases({
        RPC_VERSION,
        createRequestWithId: id => () => JsonRPC.createRequest(id, 'method_to_call'),
        createRequestWithMethodName,
        createRequestWithParameters: params => () => JsonRPC.createRequest(1, 'test', params)
    });

    it(`Throws an error if requested method name starts with prefix for internal requests ("${JsonRPC.INTERNAL_MESSAGE_PREFIX}")`, function() {
        expect(createRequestWithMethodName(`${JsonRPC.INTERNAL_MESSAGE_PREFIX}method`)).to.throw(Error);
        expect(createRequestWithMethodName(`${JsonRPC.INTERNAL_MESSAGE_PREFIX}`)).to.throw(Error);
    });
});



