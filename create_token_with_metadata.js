import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import 'dotenv/config'
import base58 from 'bs58'
import { SystemProgram, MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMint2Instruction } from "@solana/spl-token"
import { MPL_TOKEN_METADATA_PROGRAM_ID, createMetadataAccountV3 } from '@metaplex-foundation/mpl-token-metadata'
//创建一个密钥对儿，用于铸币
const mintKeypair = Keypair.generate();
console.log(`mint publickey: ${mintKeypair.publicKey.toBase58()}`)

//payer
const payer = Keypair.fromSecretKey(process.env.SECRET_KEY)
console.log(`payer address:${payer.publicKey.toBase58()}`)

const connection = new Connection(process.env.DEV_RPC_URL)
const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE)

//构建创建mint账户指令
const createAccountTi = SystemProgram.createAccount({
    /** The account that will transfer lamports to the created account */
    fromPubkey: payer.publicKey,
    /** Public key of the created account */
    newAccountPubkey: mintKeypair.publicKey,
    /** Amount of lamports to transfer to the created account */
    lamports: number,
    /** Amount of space in bytes to allocate to the created account */
    space: MINT_SIZE,
    /** Public key of the program to assign as the owner of the created account */
    programId: TOKEN_PROGRAM_ID
})

//初始化这个mint账户
const createInitializeMintTi = createInitializeMint2Instruction(
    mint = mintKeypair.publicKey,
    decimals = 6,
    mintAuthority = payer.publicKey,
    freezeAuthority = payer.publicKey
)
const METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);


//定义元数据账户
const [metadataPDA] =
PublicKey.findProgramAddressSync([
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mintKeypair.publicKey.toBuffer()
],
METADATA_PROGRAM_ID
)

