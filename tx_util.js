import { TransactionMessage, VersionedTransaction } from "@solana/web3.js"

export async function buildTransaction(connection, payerKey, 
    instructions, signers) {
    const recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash)
    const txMessage = new TransactionMessage({
        payerKey,
        instructions,
        recentBlockhash
     }).compileToV0Message()
    
    //创建交易
    const tx = new VersionedTransaction(txMessage)
    //签名
    tx.sign(signers)
    return tx
}