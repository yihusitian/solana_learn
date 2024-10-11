import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair, Transaction, sendAndConfirmTransaction, SystemProgram } from "@solana/web3.js";
import 'dotenv/config'
import base58 from 'bs58'

const keypair = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY))
console.log(`fromAddress: ${keypair.publicKey.toBase58()}`)
const toAddress = 'HZiygmcg3HWgKnbcRiFH76Z9ab8B369pp6PabRvPHEyS'

console.log(LAMPORTS_PER_SOL)

const transaction = new Transaction()
transaction.add(
    SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: LAMPORTS_PER_SOL * 0.05
    })
)

console.log(PublicKey.isOnCurve(toAddress))

console.log(PublicKey.isOnCurve("HZiygmcg3HWgKnbcRiFH76Z9ab8B369pp6PabRvPHEy2"))

// const connection = new Connection("")

// sendAndConfirmTransaction()