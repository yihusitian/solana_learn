import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import 'dotenv/config'
import chalk from "chalk";
import { MAINNET_PROGRAM_ID } from '@raydium-io/raydium-sdk'
import fs from 'fs'

const RPC_ENDPOINT = process.env.RPC_ENDPOINT ?? clusterApiUrl('mainnet-beta');
const RPC_WEBSOCKET_ENDPOINT = process.env.RPC_WEBSOCKET_ENDPOINT ?? 'wss://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT
})
//raydium 账号
const rayFee = new PublicKey('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5')

//callback函数
const logsCallback = async function(params) {
    try {
        let logs = params.logs
        let err = params.err
        let signature = params.signature
        if (err) {
            console.error(`连接中包含错误信息, ${err}`);
            return;  
        }
        console.log(chalk.bgGreen(`发现新token交易: ${signature}`));
        let signer = '';
        let baseAddress = '';
        let baseDecimals = 0;
        let baseLpAmount = 0;
        let quoteAddress = '';
        let quoteDecimals = 0;
        let quoteLpAmount = 0;
        //获取指定的交易信息
        // {
        //     /** The slot during which the transaction was processed */
        //     slot: number;
        //     /** The details of the transaction */
        //     transaction: ParsedTransaction;
        //     /** Metadata produced from the transaction */
        //     meta: ParsedTransactionMeta | null;
        //     /** The unix timestamp of when the transaction was processed */
        //     blockTime?: number | null;
        //     /** The version of the transaction message */
        //     version?: TransactionVersion;
        // };
        const parsedTransaction = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });
        console.log('parsedTransaction:', parsedTransaction)
        if (parsedTransaction && parsedTransaction?.meta.err == null) {
            console.log(`成功解析交易`);
            //创建者
            signer = parsedTransaction?.transaction.message.accountKeys[0].pubkey.toString();
            console.log(`创建者, ${signer}`);
    
            //变化后的balance
            const postTokenBalances = parsedTransaction?.meta.postTokenBalances;
            console.log('postTokenBalances:', postTokenBalances)
    
            const baseInfo = postTokenBalances?.find(
              //owner是raydium且token变动不是wsol
              (balance) => balance.owner === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' && balance.mint !== 'So11111111111111111111111111111111111111112'
            );
            console.log('baseInfo:', baseInfo)
    
            //提取流动性池创建相关的 base 和 quote 代币的信息
            /**
             * 
             * 在金融和加密货币交易中，quote 和 base 是常用术语，
             * 通常用于描述交易对中的两个代币或资产。以下是它们的定义和含义：
                Base（基础资产）
                定义：Base 资产是交易对中的基础资产，在交易对中放在前面。
                作用：它表示买入或卖出的资产。
                示例：在 BTC/USDT 中，BTC 是 base 资产，表示你要交易的比特币数量。
                Quote（计价资产）
                定义：Quote 资产是交易对中的计价资产，通常放在后面。
                作用：它表示 base 资产的价格或价值。
                示例：在 BTC/USDT 中，USDT 是 quote 资产，表示每单位 BTC 的价格（用 USDT 表示）。
             */

            if (baseInfo) {
              //新代币合约信息
              baseAddress = baseInfo.mint;
              //代币精度
              baseDecimals = baseInfo.uiTokenAmount.decimals;
              //代币数量
              baseLpAmount = baseInfo.uiTokenAmount.uiAmount;
            }
    
            const quoteInfo = postTokenBalances.find(
              //owner是raydium且token变动是wsol
              (balance) => balance.owner == '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' && balance.mint == 'So11111111111111111111111111111111111111112'
            );
            console.log('quoteInfo:', quoteInfo)

            if (quoteInfo) {
              //计价代币合约信息 WSOL
              quoteAddress = quoteInfo.mint;
              quoteDecimals = quoteInfo.uiTokenAmount.decimals;
              quoteLpAmount = quoteInfo.uiTokenAmount.uiAmount;
            }
        }
        const newTokenData = {
            lpSignature: signature,
            creator: signer,
            timestamp: new Date().toISOString(),
            baseInfo: {
              baseAddress,
              baseDecimals,
              baseLpAmount,
            },
            quoteInfo: {
              quoteAddress: quoteAddress,
              quoteDecimals: quoteDecimals,
              quoteLpAmount: quoteLpAmount,
            },
            logs: logs,
        };
        
    } catch (error) {
        const errorMessage = `error occured in new solana token log callback function, ${JSON.stringify(error, null, 2)}`;
        console.log(chalk.red(errorMessage));
        // Save error logs to a separate file
        fs.appendFile(
          'errorNewLpsLogs.txt',
          `${errorMessage}\n`,
          function (err) {
            if (err) {
                console.log('error writing errorlogs.txt', err);
            }
          }
        );
    }
}


async function monitorNewTokens() {
    console.log(chalk.green(`monitoring new solana tokens...`));
    try {
      connection.onLogs(rayFee, logsCallback, 'confirmed');
    } catch (error) {
      const errorMessage = `error occured in new sol lp monitor, ${JSON.stringify(error, null, 2)}`;
      console.log(chalk.red(errorMessage));
      // Save error logs to a separate file
      fs.appendFile('errorNewLpsLogs.txt', `${errorMessage}\n`, function (err) {
        if (err) console.log('error writing errorlogs.txt', err);
      });
    }
  }
  
  monitorNewTokens();