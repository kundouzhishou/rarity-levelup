require('dotenv').config()
const ethers = require('ethers');
const web3 = require("web3");
const EthereumTx = require('ethereumjs-tx')

const { NonceManager } = require('@ethersproject/experimental')

const CONTRACT_ADDRESS = "0x9dd9b2cfacdb273b1d552c6f59b059b099247734";

let jsoning = require('jsoning')
const db = new jsoning(`./fomo/db.json`);

FTMPROVIDER='https://rpc.ftm.tools/'

class Node {
    constructor(privateKey, publicKey) {
        this.privateKey = privateKey; 
        this.publicKey = publicKey;

        const provider = new ethers.providers.JsonRpcProvider(FTMPROVIDER, 250);
        this.wallet = new ethers.Wallet(this.privateKey);
        this.account = this.wallet.connect(provider);
        this.nonceManager = new NonceManager(this.account);

        const fomoAbi = require(`./fomo/${CONTRACT_ADDRESS}.json`)
        this.fomoContract = new ethers.Contract(`${CONTRACT_ADDRESS}`, fomoAbi, provider);
        this.fomoWriteContract = this.fomoContract.connect(this.nonceManager);
    }

    async getBalance() {
        let balance = await this.account.getBalance();
        balance = web3.utils.fromWei(balance.toString());
        return balance;
    }

    async getMetaBalance() {
        let balance = await this.fomoContract.balanceOf(this.publicKey);
        balance = web3.utils.fromWei(balance.toString());
        return balance;
    }
    
    async transfer(address, amount) {
        let data = {to:address, from:this.publicKey,value:web3.utils.toHex(web3.utils.toWei(amount.toString(),'ether'))}
        await this.account.sendTransaction(data);
    }

    async airdrop(inviter) {
        try {
            let response = await this.fomoWriteContract.airdrop(inviter);
            await response.wait();
            console.log(`airdrop successfull`);
        }catch(err) {
            console.log('airdrop failed:', this.publicKey);
        }
    }
}

module.exports = Node;