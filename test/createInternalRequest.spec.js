const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;
const testCreateAnyRequestCases = require('./_createAnyRequestCases');

const RPC_VERSION = process.env.RPC_VERSION;

describe('#createInternalRequest', () => {
    testCreateAnyRequestCases({
        RPC_VERSION,
        createRequestWithId: id => () => JsonRPC.createInternalRequest(id, 'method_to_call'),
        createRequestWithMethodName: name => () => JsonRPC.createInternalRequest(1, name),
        createRequestWithParameters: params => () => JsonRPC.createInternalRequest(1, 'test', params)
    });

    it('Adds internal method name prefix if it\'s omitted', () => {
        const unprefixedMethodName = 'method';
        const prefixedMethodName = `${JsonRPC.INTERNAL_MESSAGE_PREFIX}${unprefixedMethodName}`;
        expect(
            JsonRPC.createInternalRequest(1, prefixedMethodName).method
        ).to.be.equal(prefixedMethodName);
        expect(
            JsonRPC.createInternalRequest(1, unprefixedMethodName).method
        ).to.be.equal(prefixedMethodName);
    });
});
