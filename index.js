import { Keypair } from "@solana/web3.js";

// //创建新钱包
// const keypair = Keypair.generate()
// console.log(keypair)

// //打印公钥和私钥
// const privateKey = keypair.secretKey
// console.log("publicKey:", keypair.publicKey.toBase58())
// console.log(`privateKey:[${privateKey.toString()}]`)
// // 将私钥 Uint8Array 转为 Base64 字符串
// const base64PrivateKey = Buffer.from(privateKey).toString('base64');
// console.log(`base64PrivateKey:`, base64PrivateKey)


import "dotenv/config"
import base58 from 'bs58'

//从.env文件中读取私钥
const secret_key = process.env.SECRET_KEY
console.log(`secret_key:${secret_key}`)
//根据私钥获取keypair对象 Keypair.fromSecretKey 接收的参数为Uint8Array，因此需要使用Buffer.from转一把
const secret_key_buffer = base58.decode(secret_key)
console.log(`secret_key_uint_arr: ${secret_key_buffer}`)
const secret_key_uint_arr = Buffer.from(secret_key_buffer)
const keypair = Keypair.fromSecretKey(secret_key_uint_arr)
console.log(`keypair publicKey: ${keypair.publicKey.toBase58()}`)
console.log(`keypari privateKey: [${keypair.secretKey.toString()}]`)
console.log(`keypari privateKey: [${base58.encode(keypair.secretKey)}]`)

//base58互转
