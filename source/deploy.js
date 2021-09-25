require('dotenv').config()
const ethers = require('ethers')
const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');
const endpoint = process.env.FTMPROVIDER;
const provider = new ethers.providers.JsonRpcProvider(endpoint, 250);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

console.log(`Loaded wallet ${wallet.address}`);

function compile(filepath) {
    console.log(`compile ${filepath}`);
    let input = {
       language: 'Solidity',
       sources: {
       },
       settings: {
          outputSelection: {
             '*': {
                '*': ['*'],
             },
          },
       },
    };
    filepath = path.resolve(filepath);
    const dir = path.dirname(filepath);
    const fileName = path.basename(filepath,".sol");
    const soleFileName = path.basename(filepath);

    const fileContent = fs.readFileSync(filepath, 'utf8');
    input["sources"][soleFileName] = {content: fileContent};

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors) {
        // console.error(output.errors);
        // throw '\nError in compilation please check the contract\n';
        for (error of output.errors) {
            if (error.severity === 'error') {
                throw `Error found at ${filepath}: ${error}`;
                break;
            }
        }
    }

    fs.outputJsonSync(
        path.resolve(dir, `${fileName}.json`), 
        {
            abi: output.contracts[soleFileName][fileName]["abi"],
            bytecode: output.contracts[soleFileName][fileName]["evm"]["bytecode"]["object"]
        }
    );
}

async function deploy(filepath) {
    compile(filepath);
    let jsonFilePath = path.resolve(path.dirname(filepath), `${path.basename(filepath,".sol")}.json`);
    const compiled = require(`${jsonFilePath}`)

    let contract = new ethers.ContractFactory(
        compiled.abi,
        compiled.bytecode,
        wallet
    );

    console.log(`Deploying ${filepath} in ${process.env.FTMPROVIDER}...`);
    let instance =  await contract.deploy();
    console.log(`deployed at ${instance.address}`)
    console.log("Waiting for the contract to get mined...")
    await instance.deployed()
    console.log("Contract deployed")
}

(async() => {
    deploy(process.argv[2]).catch((err)=> {
        console.error(err);
    });
})();

