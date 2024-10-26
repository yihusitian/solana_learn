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
        const parsedTransaction = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });
        if (parsedTransaction && parsedTransaction?.meta.err == null) {
            console.log(`成功解析交易`);
            //创建者
            signer = parsedTransaction?.transaction.message.accountKeys[0].pubkey.toString();
            console.log(`创建者, ${signer}`);
    
            const postTokenBalances = parsedTransaction?.meta.postTokenBalances;
            console.log(postTokenBalances)
    
            const baseInfo = postTokenBalances?.find(
              (balance) => balance.owner === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' && balance.mint !== 'So11111111111111111111111111111111111111112'
            );
            console.log(`baseInfo: ${baseInfo}`)
    
            if (baseInfo) {
              baseAddress = baseInfo.mint;
              baseDecimals = baseInfo.uiTokenAmount.decimals;
              baseLpAmount = baseInfo.uiTokenAmount.uiAmount;
            }
    
            const quoteInfo = postTokenBalances.find(
              (balance) => balance.owner == '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' && balance.mint == 'So11111111111111111111111111111111111111112'
            );
            console.log(`quoteInfo: ${quoteInfo}`)

            if (quoteInfo) {
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