require('dotenv').config()

const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet').hdkey;

const Node = require("./node");
let jsoning = require('jsoning')
const db = new jsoning(`./fomo/db.json`);

function genAccount() {
    const mnemonic = bip39.generateMnemonic()
    const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic));
    const path = "m/44'/60'/0'/0/0";
    const wallet = hdwallet.derivePath(path).getWallet();
    const address = wallet.getAddressString();
    const privateKey = wallet.getPrivateKeyString();
    const account = {
        privateKey: privateKey,
        address: address
    }

    return account;
}

function genLevelTree(level) {
    let accout = genAccount();
    accout["level"] = 1;
    accout["id"] = "1";
    let result = [accout];
    const leaf_size = 6;
    for(let childLevel = 2; childLevel <= level; childLevel++) {
        let newLevelNodes = [];
        for(let parentNode of result) {
            if(parentNode["level"] == childLevel - 1) {
                for(let m = 1; m <= leaf_size; m++) {
                    let newAccount = genAccount();
                    newAccount["level"] = childLevel;
                    newAccount["id"] = parentNode["id"] + m.toString();
                    newLevelNodes.push(newAccount);
                }
            }
        }
        result = result.concat(newLevelNodes);
    }
    return result;
}

function genData() {
    let data = genLevelTree(5);
    db.set("tree", data);
}

async function getParent(id, allNodes) {
    if(id.length == 1) 
        return null;

    let parentId = id.substring(0, id.length - 1);

    for(let node of allNodes) {
        if(node["id"] == parentId) {
            return node;
        }
    }
    return null;
}

async function claimLevel(myNode,allNodes,level) {
    for(let i = 0; i < allNodes.length; i++) {
        let node = allNodes[i];
        if(node["level"] == level) {
            let parent = await getParent(node["id"], allNodes);
            await claimNode(node, parent, myNode);
        }
    }
}

async function claimNode(targetAccount, parentAccount, myAccount) {
    console.log(`cliam ${targetAccount["id"]}, address: ${targetAccount["address"]}, parent id : ${parentAccount["id"]}`);
    let myNode = new Node(myAccount["privateKey"],myAccount["address"]);
    let targetNode = new Node(targetAccount["privateKey"],targetAccount["address"]);
    let parentNode = new Node(parentAccount["privateKey"],parentAccount["address"]);

    console.log(`target ${targetAccount["id"]} balance`,await targetNode.getMetaBalance());
    console.log(`target ${parentAccount["id"]} balance`,await parentNode.getMetaBalance());

    await myNode.transfer(targetAccount["address"], 0.03);
    await targetNode.airdrop(parentAccount["address"]);

    console.log(`target ${targetAccount["id"]} balance`,await targetNode.getMetaBalance());
    console.log(`target ${parentAccount["id"]} balance`,await parentNode.getMetaBalance());

    console.log(`claim ${targetAccount["id"]} over ....`);
}

async function test() {
    let nodes = await db.get("tree");
    let root = await getParent("11", nodes);
    let rootNode = new Node(root["privateKey"],root["address"]);
    let myNode = new Node(process.env.PRIVATE_KEY,process.env.PUBLIC_KEY);

    console.log(await myNode.getBalance());
    console.log(await rootNode.getBalance());

    console.log(await myNode.getMetaBalance());
    console.log(await rootNode.getMetaBalance()); 

    await rootNode.airdrop("0x8078a5bdd8991767e4bcff4f0e08c550fbac2376");

    console.log(await rootNode.getMetaBalance()); 



    // await myNode.transfer(root["address"], 0.03);

    // console.log(await myNode.getBalance());
    // console.log(await rootNode.getBalance());
}

const run = async() => {
    let myNode = {
        "level":0,
        "id":0,
        "privateKey": process.env.PRIVATE_KEY,
        "address": process.env.PUBLIC_KEY
    }

    let nodes = await db.get("tree");
    await claimLevel(myNode,nodes, 3);
}

// test();
run();
// genData();
