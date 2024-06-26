const ganache = require('ganache');
const { Web3, ERR_TX_UNSUPPORTED_TYPE } = require('web3');
const assert = require('assert');
const path = require('path');
const web3 = new Web3(ganache.provider());
const {interface,bytecode} = require('../compile');
let accounts,lottery;
beforeEach(async ()=>{
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
        data: bytecode
    })
    .send({
        from: accounts[0],
        gas : '1000000'
    })
})
describe('Lottery',()=>{
    it('deploys a contract',()=>{
        assert.ok(lottery.options.address);
    })

    it('allows one account to enter',async()=>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.011','ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        assert.equal(accounts[0],players[0]);
        assert.equal(1,players.length);
    })
    it('allows multiple accounts to enter',async()=>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.011','ether')
        })
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.011','ether')
        })
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.011','ether')
        })
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        assert.equal(accounts[0],players[0]);
        assert.equal(accounts[1],players[1]);
        assert.equal(accounts[2],players[2]);
        assert.equal(3,players.length);
    })
    it('requires a minimum amount of ether to enter',async ()=>{
        try{
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 0
            })
            assert(false);
        }
        catch(err){
            assert(err);
        }
    })
    it('only manager can call pickwinner',async ()=>{
        try{
            await lottery.methods.pickWinner().send({ from: accounts[1]})
            assert(false);
        }
        catch(err){
            assert(err);
        }
    })

    it('sends money to the winner and restes players array ',async ()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value: web3.utils.toWei('2','ether')
        })
        let initialbalance = await web3.eth.getBalance(accounts[0]);
        const initialplayers = await lottery.methods.getPlayers().call({from : accounts[0]});
        await lottery.methods.pickWinner().send({from: accounts[0]});
        let finalbalance = await web3.eth.getBalance(accounts[0]);
        let difference = finalbalance - initialbalance;
        console.log(difference);

        const finalplayers = await lottery.methods.getPlayers().call({from : accounts[0]});
        assert(difference> web3.utils.toWei('1.8','ether'));
        assert.equal(0,finalplayers);
    })
    
})