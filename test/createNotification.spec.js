const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;
const testCreateAnyNotificationCases = require('./_createAnyNotificationCases');

const RPC_VERSION = process.env.RPC_VERSION;

describe('#createNotification', () => {
    function createNotificationWithName(name) {
        return () => JsonRPC.createNotification(name);
    }

    testCreateAnyNotificationCases({
        RPC_VERSION,
        createNotificationWithName,
        createNotificationWithParameters: params => () => JsonRPC.createNotification('test', params)
    });


    it(`Throws an error if notification name starts with prefix for internal notifications ("${JsonRPC.INTERNAL_MESSAGE_PREFIX}")`, () => {
        expect(createNotificationWithName(`${JsonRPC.INTERNAL_MESSAGE_PREFIX}method`)).to.throw(Error);
        expect(createNotificationWithName(`${JsonRPC.INTERNAL_MESSAGE_PREFIX}`)).to.throw(Error);
    });
});
