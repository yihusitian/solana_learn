import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import 'dotenv/config'
import base58 from 'bs58'
import { createAssociatedTokenAccount, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

//token账户
const tokenKeypair = Keypair.fromSecretKey(base58.decode(process.env.MINT_SECRET_KEY))
console.log(`mint publickey: ${tokenKeypair.publicKey.toBase58()}`)
const tokenMint = tokenKeypair.publicKey
//payer
const payer = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY))
console.log(`payer address:${payer.publicKey.toBase58()}`)

const connection = new Connection(process.env.DEV_RPC_URL)

//查询或者创建ata账户，如果ata账号已经存在，则这一步将非常快，反之可能会比较耗时
const ataAccount = await getOrCreateAssociatedTokenAccount(connection, payer, 
    tokenMint, payer.publicKey
).then(res => res.address)
console.log('ataAccount:', ataAccount)

//需要注意的是这里铸造的数量是把精度也算进去了，比如精度为6 100000000 表示100个代币
const mintAmount = 100_000_000 * 1000_000;
const transactionSignature = await mintTo(connection, 
    payer, 
    tokenMint, 
    ataAccount, 
    payer, 
    mintAmount)

 console.log(`sig: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`)
