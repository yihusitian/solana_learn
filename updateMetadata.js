import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import base58 from 'bs58';
import 'dotenv/config';
import { createUpdateMetadataAccountV2Instruction, PROGRAM_ID as MPL_TOKEN_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata'
import { buildTransaction } from "./tx_util.js";

const payer = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY))
console.log(`payer address: ${payer.publicKey.toBase58()}`)

const tokenKeypair = Keypair.fromSecretKey(base58.decode(process.env.MINT_SECRET_KEY))
console.log(`token address: ${tokenKeypair.publicKey.toBase58()}`)

//tokeninfo
const tokenInfo = {
    decimals: 9,
    name: 'NEW TRUMP WIN pump',
    symbol: 'TRUMPWIN',
    uri: 'https://thisisnot.arealul/new.json'
}

//元数据账户
const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), MPL_TOKEN_PROGRAM_ID.toBuffer(), tokenKeypair.publicKey.toBuffer()],
    MPL_TOKEN_PROGRAM_ID
)
console.log(`元数据账户: ${metadataPDA.toBase58()}`)

//
const transactionInstruction = createUpdateMetadataAccountV2Instruction(
    {
        metadata: metadataPDA,
        updateAuthority: payer.publicKey
    },
    {
        updateMetadataAccountArgsV2: {
            data: {
                name: tokenInfo.name,
                symbol: tokenInfo.symbol,
                uri: tokenInfo.uri,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null
            },
            updateAuthority: payer.publicKey,
            primarySaleHappened: null,
            isMutable: true
        }
    }
)

const connection = new Connection(process.env.DEV_RPC_URL)
//构建交易
const tx = await buildTransaction(connection, payer.publicKey, [transactionInstruction], [payer])
console.log(`tx:${tx}`)
//发送交易
const sig = await connection.sendTransaction(tx)
console.log(`sig: https://explorer.solana.com/tx/${sig}?cluster=devnet`)
