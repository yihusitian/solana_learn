import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import 'dotenv/config'
import base58 from 'bs58'
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMint2Instruction } from "@solana/spl-token"
import { PROGRAM_ID as MPL_TOKEN_PROGRAM_ID, createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata'
import { buildTransaction } from './tx_util.js'

//创建一个密钥对儿，用于铸币
const mintKeypair = Keypair.generate();
console.log(`mint publickey: ${mintKeypair.publicKey.toBase58()}`)

//payer
const payer = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY))
console.log(`payer address:${payer.publicKey.toBase58()}`)

const connection = new Connection(process.env.DEV_RPC_URL)
const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE)

const tokenInfo = {
    decimals: 6,
    name: 'Seven star gold',
    symbol: 'SSG',
    uri: 'https://thisisnot.arealul/info.json'
}
//构建创建铸造 账户指令
const createAccountTi = SystemProgram.createAccount({
    /** The account that will transfer lamports to the created account */
    fromPubkey: payer.publicKey,
    /** Public key of the created account */
    newAccountPubkey: mintKeypair.publicKey,
    /** Amount of lamports to transfer to the created account */
    lamports,
    /** Amount of space in bytes to allocate to the created account */
    /** MINT_SIZE : Byte length of a mint */
    space: MINT_SIZE,
    /** Public key of the program to assign as the owner of the created account */
    programId: TOKEN_PROGRAM_ID
})

//初始化这个铸造账户，让token程序知道这个账户将用于铸造
// * @param mint            铸造账户
// * @param decimals        精度
// * @param mintAuthority   铸造权限
// * @param freezeAuthority 冻结权限
// 只有被指定了铸造权限的账户才能铸造更多token
const createInitializeMintTi = createInitializeMint2Instruction(
    mintKeypair.publicKey,
    tokenInfo.decimals,
    payer.publicKey,
    payer.publicKey
)

//定义PDA账户
//pda账户允许程序为特殊类型签名交易
//如下代码指定该pda账户将归metaplex程序所拥有，标识通常以metaplex开头
//TOKEN元数据程序拥有对该账户的控制权，用于存储与token元数据相关的元数据信息
//例如token名称，符号，图片等
//第一个入参是一个数组，seeds种子
const [metadataPDA, bump] = PublicKey.findProgramAddressSync([
    Buffer.from('metadata'),
    MPL_TOKEN_PROGRAM_ID.toBuffer(),
    mintKeypair.publicKey.toBuffer()
],
MPL_TOKEN_PROGRAM_ID
)
console.log(`metadataPDA: ${metadataPDA}`)
console.log(`bump: ${bump}`)

//在链上创建元数据账户
const createMetaAccountTi = createCreateMetadataAccountV3Instruction(
    {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey
    },
    {
        createMetadataAccountArgsV3: {
            data: {
                name: tokenInfo.name,
                symbol: tokenInfo.symbol,
                uri: tokenInfo.uri,
                //销售费用基点
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null
            },
            //非nft类型的token通常设置为null
            collectionDetails: null,
            //元数据信息是否可以更新
            isMutable: true
        }
    }
)

const tx = await buildTransaction(connection, payer.publicKey, [
    createAccountTi,
    createInitializeMintTi,
    createMetaAccountTi
], [payer, mintKeypair])

const transactionSignature = await connection.sendTransaction(tx)
console.log(`sig: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`)
