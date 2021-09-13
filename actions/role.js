require('dotenv').config()
const ethers = require('ethers')
const contracts = require('../config/contracts')
const getBlockTime = require('./blocktime');
const getNonce = require('../utils/nonce');

const rarityContractAddress = contracts.rarity
const rarityAbi = require('../abis/rarity.json')

const { provider, nonceManager } = require('../config/wallet')
const { log, error } = require('./utils')

const rarityContract = new ethers.Contract(rarityContractAddress, rarityAbi, provider)
const writeRarityContract = rarityContract.connect(nonceManager);

let jsoning = require('jsoning')
const db_role = new jsoning(`./db/role.json`);

const GAS_LIMIT = 125000;

class Role {
    constructor(id) {
        this.id = id;
        this.adventurers_log = 0;
    }

    async initialize() {
        let existed = await db_role.has(this.id.toString());
        if(existed){
            let data = await db_role.get(this.id.toString());
            this.adventurers_log = data["adventurers_log"];
        }
        return true;
    }

    async tryAdventure() {
        let now = await getBlockTime();
        
        // filter ids which adventured successfull
        if (now > this.adventurers_log + 100) {
            try {
                // double check 
                let log_data = await rarityContract.adventurers_log(this.id);
                let log_time = ethers.BigNumber.from(log_data).toNumber();

                now = await getBlockTime();
                if(log_time > now) {
                    this.adventurers_log = log_time;
                    await this._save_to_db();
                    log('adventure', this.id, `update adventure time, next time:${this.adventurers_log}, left:${this.adventurers_log - now}`);
                    return;
                }
                
                let nonce = await getNonce();
                let response = await writeRarityContract.adventure(this.id,{
                    gasLimit: GAS_LIMIT,
                    nonce: nonce
                });
                // dont to wait for confirmation
                // await response.wait();
                now = await getBlockTime();
                // add 10 sec for safe
                this.adventurers_log = now + 24*60*60;

                await this._save_to_db();
                log('adventure', this.id, `Adventure successfull!  next time: ${this.adventurers_log}`);
            } catch (err) {
                error('adventure', this.id, `Could not send the tx: ${err}`)
            }
        } else {
            log('adventure', this.id, `Not yet time to adventure. now:${now}, next time:${this.adventurers_log}, left:${this.adventurers_log - now}`);
        }
    }

    async _save_to_db() {
        // console.log("save to db ...");
        let data = {};
        data["adventurers_log"] = this.adventurers_log;
        
        await db_role.set(this.id.toString(), data);
    }
}

module.exports = Role;
/*
async() => {
    let now = await getBlockTime();
    console.log(now);
}
*/