import * as bip39 from "bip39"
import { Keypair } from "@solana/web3.js"
import base58 from 'bs58'
import { HDKey } from 'micro-ed25519-hdkey'

/**
 * BIP39 (Mnemonic Code for Generating Deterministic Keys)
    BIP39 定义了一种将随机数转换成助记词的方法，这些助记词可以用来生成种子，进而生成私钥和公钥。它的主要目标是让用户更容易地备份和恢复钱包。
    主要步骤：
        1.生成随机数。
        2.将随机数转换为助记词（一系列单词）。
        3.将助记词转换为种子。
        4.用种子生成HD钱包的根密钥。
 */

//bip39 生成助记词
// const mnemonic = bip39.generateMnemonic()
const mnemonic = "shield clump check empower beef glue vault liberty valley cricket manage clean"
console.log(`助记词: ${mnemonic}`)
//根据助记词和password生成seed（种子）
// const seed = await bip39.mnemonicToSeed(mnemonic, "")
// 64位的Buffer
const seed = bip39.mnemonicToSeedSync(mnemonic, "")

//根据seed生成keypair seed入参接收32位的
const keypair = Keypair.fromSeed(seed.subarray(0, 32))

console.log(`public_key: ${keypair.publicKey.toBase58()}`)
console.log(`privateKey: ${base58.encode(keypair.secretKey)}`)

//micro-ed25519-hdkey 库是一个用于生成和管理 SLIP-0010 层次确定性（HD）钱包 的轻量级实现。这个库可以从单一的种子创建多个私钥和公钥对。这在需要安全密钥管理的应用中非常有用，例如加密货币钱包。
//ed25519是一种椭圆曲线的数字签名算法，更高效、安全、稳定

/**
 * BIP44 (Multi-Account Hierarchy for Deterministic Wallets)
    BIP44 定义了一种在分层确定性（HD）钱包中管理多个加密货币账户的标准。它基于BIP32，并依赖于BIP39生成的种子来生成一棵密钥树。
    路径格式：m / purpose' / coin_type' / account' / change / address_index
    主要级别：
        purpose：用途，一般固定为 44' 以表示BIP44。
        coin_type：币种，例如比特币是 0'，以太坊是 60'。
        account：账户索引，用于管理多个账户。
        change：0代表外部账户，1代表内部账户（找零地址）。
        address_index：地址索引，用于生成具体的地址。
    示例： 路径：m/44'/0'/0'/0/0 表示比特币的第一个账户的第一个外部地址。
总结：
    BIP39 负责将助记词转换为种子，用于生成HD钱包的根密钥。
    BIP44 则用标准化的路径结构来管理多个币种和账户，确保兼容性和易用性。
 * 
 */

//生成根钱包
/**
 * HDKey {
    depth: 0,
    index: 0,
    parentFingerprint: 0,
    chainCode: Uint8Array(32) [
        54, 185, 178,  51, 255,  90,  15,  72,
        96,  95, 148, 201, 221, 173, 230,  52,
        29,  75, 179, 142,  88, 221,  74,  94,
        249,   4, 188, 129, 137, 101, 180, 129
    ],
    privateKey: Uint8Array(32) [
        67, 233,  75, 165, 124, 193, 215,  64,
        31,  68, 104, 219,  44,   3,  15,  40,
        189, 209, 171,  61, 146,  85, 132,  22,
        144, 175, 231,  68,  72, 160,  44, 220
    ]
    }
 */
const hdkey = HDKey.fromMasterSeed(seed)
for (let i = 0; i < 10; i++) {
    const path = `m/44'/501'/${i}'/0'`;
    const keypair = Keypair.fromSeed(hdkey.derive(path).privateKey)
    console.log(`keypair_${i}公钥:${keypair.publicKey.toBase58()}私钥:${base58.encode(keypair.secretKey)}`)
}


//生成指定前缀或后缀的钱包地址 使用solana-cli命令
//solana-keygen grind 命令中的前缀或者后缀参数不能包含非字母字符和非十六进制字符。可以尝试使用十六进制字符 (0-9, a-f) 来生成地址
/**
 * 如使用命令：solana-keygen grind --starts-with ccc666:1
 * 可以生成 ccc666作为前缀的钱包地址，生成数量为1个，这个生成速度可能会比较慢
 * 
 * 使用命令：solana-keygen grind --starts-and-ends-with aaa:fff:1
 * 可以生成 aaa开头，fff结尾的钱包地址，生成数量为1个
 * 
 * 更多命令可以使用 solana-keygen grind -h 获得使用帮助
 * 
 */
