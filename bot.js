const { WebSocketProvider, Wallet, Contract, parseEther } = require('ethers')
const blockchain = require('./blockchain.json')
require('dotenv').config()
const fs = require('fs')

const provider = new WebSocketProvider(process.env.LOCAL_RPC_URL_WS)
const wallet = Wallet.fromPhrase(process.env.MNEMONIC, provider)
const factory = new Contract(
	blockchain.factoryAddress,
	blockchain.factoryAbi,
	provider
)

const router = new Contract(
	blockchain.routerAddress,
	blockchain.routerAbi,
	wallet
)

const SNIPE_LIST_FILE = 'snipeList.csv'
const TOKEN_LIST_FILE = 'tokenList.csv'

const init = () => {
	factory.on('PairCreated', (token0, token1, pairAddress) => {
		console.log(`
      New pair detected from
      ======================
      pairAddress: ${pairAddress}
      token0: ${token0}
      token1: ${token1}`)
		//saving information in file ↓
		if (
			token0 !== blockchain.WETHAddress &&
			token1 !== blockchain.WETHAddress
		) {
			const t0 = token0 === blockchain.WETHAddress ? token0 : token1
			const t1 = token0 === blockchain.WETHAddress ? token1 : token0
			fs.appendFileSync(SNIPE_LIST_FILE, `${pairAddress}, ${t0}, ${t1}\n`)
		}
	})
}

const timeout = ms => {
	return new Promise(resolve => setTimeout(resolve, ms))
}

const snipe = async () => {
	let snipeList = fs.readFileSync(SNIPE_LIST_FILE)
	snipeList = snipeList
		.toString()
		.split('\n')
		.filter(snipe => snipe !== '')

	if (snipeList.length === 0) return
	for (const snipe of snipeList) {
		const [pairAddress, wethAddress, tokenAddress] = snipe.split(',')
		console.log(`Trying to sni[e ${tokenAddress} on ${pairAddress}`)

		const pair = new Contract(pairAddress, blockchain.pairAbi, wallet)

		const totalSupply = await pair.totalSupply()
		if (totalSupply === 0n) {
			console.log('Pool is empty, snipe cancelled')
			continue
		}

		const tokenIn = wethAddress
		const tokenOut = tokenAddress
		const amountIn = parseEther('0.1')
		const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut])
		const amountOutMin = amounts[1] - (amount[1] * 5n) / 100n
		console.log(`
      Buying new token
      ================
      tokenIn: ${amountIn.toString()} ${tokenIn} (WETH)
      tokenOut: ${amountOut.toString()} ${tokenOut}`)

		const tx = router.swapExactTokensForTokens(
			amountIn,
			amountOutMin,
			[tokenIn, tokenOut],
			blockchain.recipient,
			Date.now() + 1000 * +60 * 10
		) // 10 minutes from now

		const receipt = await tx.wait()
		console.log(`TX receipt: ${receipt}`)

		if (receipt.status === '1') {
			fs.appendFileSync(
				TOKEN_LIST_FILE,
				`${receipt.blockNumber}, ${wethAddress}, ${tokenAddress}, ${
					amountOutMin / amountIn
				}\n`
			)
		}
	}
}

const managePosition = async () => {
	//TODO: stop loss/take profit
}

const main = async () => {
	console.log('Trading bot starting ...')
	init()
	while (true) {
		await timeout()
	}
}

main()
