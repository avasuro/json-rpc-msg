const JsonRPC = require('../src/json-rpc-parse');
const expect = require('chai').expect;

module.exports = ({
    RPC_VERSION,
    createNotificationWithName,
    createNotificationWithParameters
}) => {
    it('Returns valid notification object', () => {
        let eventName = 'eventName';
        let eventParams = {a: 'a'};
        const result = JsonRPC.createNotification(eventName, eventParams);
        expect(result).to.be.an('object');
        expect(result).to.have.property('jsonrpc', RPC_VERSION);
        expect(result).to.not.have.property('id');
        expect(result).to.have.property('method', eventName);
        expect(result).to.have.property('params', eventParams);
    });

    it('Allows to create notification without params', () => {
        const emptyParams = [undefined, null];
        emptyParams.forEach((param) => {
            let eventName = 'eventName';
            const result = JsonRPC.createNotification(eventName, param);
            expect(result).to.be.an('object');
            expect(result).to.have.property('jsonrpc', RPC_VERSION);
            expect(result).to.not.have.property('id');
            expect(result).to.have.property('method', eventName);
            expect(result).to.not.have.property('params');
        });
    });

    it('Throws an error if notification name is not defined', () => {
        expect(createNotificationWithName(undefined)).to.throw(Error);
        expect(createNotificationWithName(null)).to.throw(Error);
        expect(createNotificationWithName('')).to.throw(Error);
        expect(createNotificationWithName('   ')).to.throw(Error);
    });

    it('Throws an error if notification name have incorrect type', () => {
        expect(createNotificationWithName(0)).to.throw(Error);
        expect(createNotificationWithName(1)).to.throw(Error);
        expect(createNotificationWithName(true)).to.throw(Error);
        expect(createNotificationWithName(false)).to.throw(Error);
        expect(createNotificationWithName({})).to.throw(Error);
        expect(createNotificationWithName([])).to.throw(Error);
    });

    it('Accepts notification parameters as an array or an object', () => {
        expect(createNotificationWithParameters({})).to.not.throw(Error);
        expect(createNotificationWithParameters([])).to.not.throw(Error);
    });

    it('Throws an error if notification parameters have incorrect type', () => {
        expect(createNotificationWithParameters(0)).to.throw(Error);
        expect(createNotificationWithParameters(1)).to.throw(Error);
        expect(createNotificationWithParameters('')).to.throw(Error);
        expect(createNotificationWithParameters('   ')).to.throw(Error);
        expect(createNotificationWithParameters('bad_params')).to.throw(Error);
        expect(createNotificationWithParameters(true)).to.throw(Error);
        expect(createNotificationWithParameters(false)).to.throw(Error);
    });
};
