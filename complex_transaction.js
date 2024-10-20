import { Connection, PublicKey, Keypair, VersionedMessage, TransactionMessage, SystemProgram, VersionedTransaction } from "@solana/web3.js";
import base58 from 'bs58'
import 'dotenv/config'
import fs from 'fs'

const payer = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY))
console.log('payer address: ', payer.publicKey.toBase58())

const connection = new Connection(process.env.DEV_RPC_URL)

function generateKeypair() {
    const newkeypair = Keypair.generate()
    const newPublickey = newkeypair.publicKey.toBase58()
    console.log('newkeypair address: ', newPublickey)
    const newPrivateKey = base58.encode(newkeypair.secretKey)
    console.log('newPrivateKey: ', newPrivateKey)
    fs.writeFileSync(newPublickey + '.txt', newPrivateKey, (err) => {
        if (err) {
            console.log('Error writing file: ', err)
        } else {
            console.log('File has been saved successfuly.')
        }
    })
    return newkeypair
}

const testKeypair = generateKeypair()
console.log('testWallet: ', testKeypair.publicKey.toBase58())
const staticPublickey = new PublicKey('HZiygmcg3HWgKnbcRiFH76Z9ab8B369pp6PabRvPHEyS')
console.log('staticWallet: ', staticPublickey.toBase58())

//创建账户
const space = 0
//获取最小账户租金
const minimumBalanceForRentExemption = await connection.getMinimumBalanceForRentExemption(space)
//创建账户指令
const createAccountTI = SystemProgram.createAccount({
     /** The account that will transfer lamports to the created account */
     fromPubkey: payer.publicKey,
     /** Public key of the created account */
     newAccountPubkey: testKeypair.publicKey,
     /** Amount of lamports to transfer to the created account */
     lamports: minimumBalanceForRentExemption + 200_0000,
     /** Amount of space in bytes to allocate to the created account */
     space,
     /** Public key of the program to assign as the owner of the created account */
     programId: SystemProgram.programId
})


//创建转账指令
const transferTI = SystemProgram.transfer({
    /** Account that will transfer lamports */
    fromPubkey: payer.publicKey,
    /** Account that will receive transferred lamports */
    toPubkey: testKeypair.publicKey,
    /** Amount of lamports to transfer */
    lamports: 400_0000
})

//创建转账指令
const transferStaticTI = SystemProgram.transfer({
    /** Account that will transfer lamports */
    fromPubkey: payer.publicKey,
    /** Account that will receive transferred lamports */
    toPubkey: staticPublickey,
    /** Amount of lamports to transfer */
    lamports: 100_0000
})

//创建交易消息
const recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash)
console.log('recentBlockhash:', recentBlockhash)
const txMessage = new TransactionMessage({
    payerKey: payer.publicKey,
    instructions: [
        createAccountTI,
        transferStaticTI,
        transferTI,
        transferStaticTI
    ],
    recentBlockhash: recentBlockhash
 }).compileToV0Message()

//创建交易
const tx = new VersionedTransaction(txMessage)
console.log(tx)
//签名
tx.sign([payer, testKeypair])
//发送交易

const sig = await connection.sendTransaction(tx)
console.log(`sig: https://explorer.solana.com/tx/${sig}?cluster=devnet`)




