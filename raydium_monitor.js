import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import 'dotenv/config'
import chalk from "chalk";
import { MAINNET_PROGRAM_ID } from '@raydium-io/raydium-sdk'
import fs from 'fs'
import { Metadata, PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import axios from 'axios'

// 用于清理字符串中 \x00 字符的函数
const cleanString = (str) => str.replace(/\x00/g, '').trim();

// 清理 JSON 对象中的所有值
function cleanMetadata(metadata) {
  const cleanedMetadata = {};
  for (const key in metadata) {
    if (typeof metadata[key] === 'string') {
      cleanedMetadata[key] = cleanString(metadata[key]);
    } else {
      cleanedMetadata[key] = metadata[key];
    }
  }
  return cleanedMetadata;
}

// 发送消息
async function sendMessageToWeChat(content) {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${process.env.QW_ACCESS_TOKEN}`;
  console.log(url)
  const data = {
    msgtype: 'markdown',
    markdown: {
      content: content, // 消息内容
    }
  };

  try {
    const response = await axios.post(url, data);
    if (response.data.errcode === 0) {
      console.log('Message sent successfully');
    } else {
      console.error('Failed to send message:', response.data);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// 获取元数据
async function fetchTokenMetadata(mintAddress) {
  // 计算代币的元数据地址（pda）
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintAddress.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  // 获取代币元数据账户信息
  const accountInfo = await connection.getAccountInfo(metadataPDA);
  if (!accountInfo) {
    console.log('No metadata found for this token.');
    return undefined;
  }

  // 解析元数据
  const metadata = Metadata.deserialize(accountInfo.data)[0];
  console.log('Token Metadata:');
  console.log(`- Name: ${metadata.data.name}`);
  console.log(`- Symbol: ${metadata.data.symbol}`);
  console.log(`- URI: ${metadata.data.uri}`);

  const {name, symbol, uri} = metadata.data
  return cleanMetadata({ name, symbol, uri })
}

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
             
                对于去中心化交易所（如 Raydium 或 Uniswap），每个流动性池一般由 
                base 和 quote 两种资产组成。例如，ETH/DAI 池中的 ETH 是 base 资产，
                而 DAI 是 quote 资产，用于计量 ETH 的价值。

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
        if (baseAddress && quoteAddress) {
          const baseTokenInfo = await fetchTokenMetadata(new PublicKey(baseAddress))
          const quoteTokenInfo = await fetchTokenMetadata(new PublicKey(quoteAddress))
          const content = `新上线交易币对儿：${baseTokenInfo.symbol}/${quoteTokenInfo.symbol} \n` +
                          `代币名称：${baseTokenInfo.name} \n` +
                          `代币地址：${baseAddress} \n` +
                          `代币数量：${baseLpAmount} \n` + 
                          `代币uri：${baseTokenInfo.uri}`
          await sendMessageToWeChat(content)
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

// await sendMessageToWeChat("<font color='red'>tes</font>")

// const {name, symbol, uri} = await fetchTokenMetadata(new PublicKey("AEn65EMsSxSiY5oujbiW16vdoEFpx75Cy61yUmZ8pump"))
// console.log(cleanMetadata({
//   name,
//   symbol,
//   uri
// }))