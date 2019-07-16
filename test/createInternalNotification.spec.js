const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;
const testCreateAnyNotificationCases = require('./_createAnyNotificationCases');

const RPC_VERSION = process.env.RPC_VERSION;

describe('#createInternalNotification', () => {
    testCreateAnyNotificationCases({
        RPC_VERSION,
        createNotificationWithName: name => () => JsonRPC.createInternalNotification(name),
        createNotificationWithParameters: params => () => JsonRPC.createInternalNotification('test', params)
    });

    it('Adds internal notification name prefix if it\'s omitted', () => {
        const unprefixedMethodName = 'method';
        const prefixedMethodName = `${JsonRPC.INTERNAL_MESSAGE_PREFIX}${unprefixedMethodName}`;
        expect(
            JsonRPC.createInternalNotification(prefixedMethodName).method
        ).to.be.equal(prefixedMethodName);
        expect(
            JsonRPC.createInternalNotification(unprefixedMethodName).method
        ).to.be.equal(prefixedMethodName);
    });
});
