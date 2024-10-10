import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import base58 from 'bs58'
import 'dotenv/config'

//LAMPORTS_PER_SOL 是solana中的最小单位，类似以太坊中的wei，1个SOL等价于10亿个LAMPORTS_PER_SOL

const user_keypair = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY))
const wallet_address = user_keypair.publicKey.toBase58()
console.log(`wallet_address:${wallet_address}`)

//连接到devnet
const devConnection = new Connection(process.env.DEV_RPC_URL)
//将字符串的钱包转为PublicKey类型的
const walletPublicKey = new PublicKey(wallet_address)
//获取钱包余额
const balance = await devConnection.getBalance(walletPublicKey)
console.log(`balance:${balance / LAMPORTS_PER_SOL} SOL`)
