const params = require('./params');

const signer = async function (multisigContract, confirmingAccounts, to, value, data, tezosTransaction) {
    let txHash = await multisigContract.methods.getTransactionHash(to, value, data, tezosTransaction).call()
    let signatureBytes = "0x"
    confirmingAccounts.sort();
    for (var i = 0; i < confirmingAccounts.length; i++) {
        let signature = (await web3.eth.sign(txHash, confirmingAccounts[i])).replace('0x', '');
        signatureBytes += signature;
    }
    return signatureBytes
}

module.exports = function(callback) {
    (async () => {
        try {
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            const erc20Contract = new web3.eth.Contract(params.erc20ABI, params.erc20Address);
            let signers = [accounts[0], accounts[2]];
            const destination = accounts[4];
            const tezosTransaction = "0x123456";
            let data = await erc20Contract.methods.transfer(destination, web3.utils.toWei("1", 'ether')).encodeABI();
            let signatures = await signer(multisigContract, signers, params.erc20Address, 0, data, tezosTransaction);
            await multisigContract.methods.execTransaction(
                params.erc20Address, 0, data, tezosTransaction, signatures
            ).send({
                from: accounts[1],
                gas: 400000
            });
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}