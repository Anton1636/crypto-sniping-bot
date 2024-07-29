const {
	WebSocketProvider,
	Wallet,
	Contract,
	ContractFactory,
	parseEther,
} = require('ethers')
const blockchain = require('./blockchain.json')
require('dotenv').config()

const provider = new WebSocketProvider(process.env.LOCAL_RPC_URL_HTTP)
const wallet = Wallet.fromPhrase(process.env.MNEMONIC, provider)
const erc20Deployer = new ContractFactory(
	blockchain.erc20Abi,
	blockchain.erc20Bytecode,
	wallet
)
const uniswapFactory = new Contract(
	blockchain.factoryAddress,
	blockchain.factoryAbi,
	wallet
)
const main = async () => {
	const token = await erc20Deployer.deploy(
		'QWE Token',
		'QWE',
		parseEther('100000000')
	)
	await token.waitForDeployment()
	console.log(`Test token deployed: ${token.target}`)

	const tx = await uniswapFactory.createPair(
		blockchain.WETHAddress,
		token.target
	)
	const receipt = await tx.wait()
	console.log('test liq pool deployed')
}

main()
