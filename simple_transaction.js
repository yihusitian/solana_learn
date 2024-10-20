 import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, TransactionMessage, VersionedTransaction, VERSION_PREFIX_MASK } from "@solana/web3.js";
 import base58 from 'bs58'
 import 'dotenv/config'

const payer = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY))
console.log(`payer address:${payer.publicKey}`)

const connection = new Connection(process.env.DEV_RPC_URL)
const balance = await connection.getBalance(payer.publicKey)

console.log(`balance:${balance / LAMPORTS_PER_SOL} sol`)

//生成一个新的密钥对儿
const newkeypair = Keypair.generate()
console.log(`newkeypair address: ${newkeypair.publicKey.toBase58()}`)

//获取指定空间的最小租金花费
const space = 0
// Fetch the minimum balance needed to exempt an account of `dataLength` size from rent
// 0字节额外空间的最小免租金余额
const lamports = await connection.getMinimumBalanceForRentExemption(0)
console.log(`0字节空间的租金费用:${lamports / LAMPORTS_PER_SOL} sol`)
//在solana上所有账号所占用的空间都需要花费 租金，所以创建账户，需要预付两年的租金，使你的账户在solana链上得以存储
//这种做法被称为免租金支付
//构建创建账户的指令
const createAccountTi = SystemProgram.createAccount({
    /** The account that will transfer lamports to the created account */
    fromPubkey: payer.publicKey,
    /** Public key of the created account */
    newAccountPubkey: newkeypair.publicKey,
    /** Amount of lamports to transfer to the created account */
    lamports: lamports,
    /** Amount of space in bytes to allocate to the created account */
    space: space,
    /** Public key of the program to assign as the owner of the created account */
    programId: SystemProgram.programId
})

//指令需要包含在交易中发送到区块链上

//获取最近的区块hash
let recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash)

//创建版本化的交易，这是solana区块链上一个相对较新的概念，正在成为一个越来越普遍的标准，并得到整个生态系统的支持  
const txmessage = new TransactionMessage({
    payerKey: payer.publicKey,
    instructions: [createAccountTi],
    recentBlockhash: recentBlockhash
}).compileToV0Message();

const tx = new VersionedTransaction(txmessage)
console.log('tx before signing: ', tx)
//交易签名 交易的参与者都签名
tx.sign([payer, newkeypair])
console.log('tx after signing: ', tx)

//完成签名以后，将交易发送到区块链
const sig = await connection.sendTransaction(tx)
console.log(`sig: https://explorer.solana.com/tx/${sig}?cluster=devnet`)
