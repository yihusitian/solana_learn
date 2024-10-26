import { Keypair } from "@solana/web3.js"
import fs from 'fs'
import base58 from 'bs58'

export function generateKeypair() {
    const newkeypair = Keypair.generate()
    const newPublickey = newkeypair.publicKey.toBase58()
    console.log('newkeypair address: ', newPublickey)
    const newPrivateKey = base58.encode(newkeypair.secretKey)
    console.log('newPrivateKey: ', newPrivateKey)
    fs.writeFileSync(newPublickey + '.txt', newPrivateKey, (err) => {
        if (err) {
            console.log('Error writing file: ', err)
        } else {
            console.log('File has been saved successfuly.')
        }
    })
    return newkeypair
}