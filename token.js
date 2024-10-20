import { Connection, PublicKey } from "@solana/web3.js";
import 'dotenv/config'

const contractAddress = "DFVa5f8FtnwAimjL9NhqT8V1XZWxTQm8LomTcXERqPoi"
const connection = new Connection(process.env.MAIN_RPC_URL)
const accountInfo = await connection.getParsedAccountInfo(new PublicKey(contractAddress))
const info = accountInfo.value.data.parsed.info
console.log(info)
console.log(`decimals:${info.decimals}`)
console.log(`supply:${info.supply}`)
