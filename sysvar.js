import { PublicKey, Connection } from "@solana/web3.js";
import "bn.js"
import "bn.js";
import BN from "bn.js";
import 'dotenv/config'

const connection = new Connection(process.env.MAIN_RPC_URL)
const colockSysvarrogram = "SysvarC1ock11111111111111111111111111111111"

const clockAccount = await connection.getAccountInfo(new PublicKey(colockSysvarrogram))
console.log(clockAccount)
console.log(clockAccount.owner.toBase58())

const data = clockAccount.data
/**
 * 
    le 代表 little-endian，是指数据的字节顺序。计算机存储数据时有两种主要的字节序：小端序（little-endian）和大端序（big-endian）。
    小端序（little-endian，le）最低有效字节存储在最低内存地址。简单来说，数据的最低有效位放在最前面。
    大端序（big-endian，be）最高有效字节存储在最低内存地址。数据的最高有效位放在最前面。
    以数值 0x12345678 为例：
        小端序：0x78 0x56 0x34 0x12
        大端序：0x12 0x34 0x56 0x78
    小端序通常用于 x86 和 x86-64 等架构，而大端序常见于某些网络协议和其他计算机架构中。在区块链和加密货币的开发中，了解字节序非常重要，因为错误的字节序会导致数据解析问题。
 * 
 */
const slot = new BN(data.slice(0, 8), 'le').toNumber()
const epochStart = new BN(data.slice(8, 16), 'le').toNumber()
const epoch = new BN(data.slice(16, 24), 'le').toNumber()
const leader_schedule_epoch = new BN(data.slice(24, 32), 'le').toNumber()
const timestamp = new BN(data.slice(32, 40), 'le').toNumber()
console.log('Slot:', slot);
console.log('Epoch Start:', epochStart);
console.log('Epoch:', epoch);
console.log('leader_schedule_epoch:', leader_schedule_epoch);
console.log('Timestamp:', timestamp);