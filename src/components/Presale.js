import { ethers } from 'ethers';
import { useContext, useEffect, useRef, useState } from 'react';
import Web3Modal from 'web3modal';
import { GlobalContext } from '../context/GlobalContext';
import CONFIG from './../abi/config.json';
import CROWDSALE_ABI from './../abi/abi.json';
import tokenAbi from './../abi/token.json';
import WalletConnectProvider from "@walletconnect/web3-provider";
const crowdsaleAddress = CONFIG.ICO_CONTRACT_ADDRESS;

const providerOptions = {
    cacheProvider: false,
    walletconnect: {
        package: WalletConnectProvider, // required
        options: {
            rpc: {
                80001: "https://polygon-mumbai.g.alchemy.com/v2/DWTM5iFBp4kWSnpQ717_uh9jgCOkYRJ9",
            },
        }
    }
};

function Presale({setError, setErrMsg}) {
    const { account, tokenBalance, bnbBalance, web3Provider, fetchAccountData, delAccount,addAccount, updateProvider } = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [recQty, setRecQty] = useState(0);

    const ethPrice = useRef(null);

    const addToken = async () => {
        const tokenAddress = CONFIG.TOKEN_CONTRACT;
        const tokenSymbol = CONFIG.TOKEN_SYMBOL;
        const tokenDecimals = CONFIG.TOKEN_DECIMAL;
        const tokenImage = '';

        try {
            // wasAdded is a boolean. Like any RPC method, an error may be thrown.
            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20', // Initially only supports ERC20, but eventually more!
                    options: {
                        address: tokenAddress, // The address that the token is at.
                        symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                        decimals: tokenDecimals, // The number of decimals in the token
                        image: tokenImage, // A string url of the token logo
                    },
                },
            });

            if (wasAdded) {
                console.log('Thanks for your interest!');
            } else {
                console.log('Your loss!');
            }
        } catch (error) {
            console.log(error);
        }
    }

    const validatePrice = () => {
        if (parseInt(ethPrice.current.value) >= 500 && parseInt(ethPrice.current.value) <= 10000) {
            return true;
        }
        return false;
    }

    const approveUSDT = async (e) => {
        e.preventDefault();
        try {
            if (!window.ethereum) {
                alert('Please install MetaMask');
                return
            }
            if (!account) {
                alert('Please connnect wallet');
                return;
            }
            if (!validatePrice()) {
                alert('Invalid Amount');
                return;
            }

            setLoading(true);
            const provider = web3Provider;
            const signer = provider.getSigner();
            const usdtContract = new ethers.Contract(CONFIG.USDT_ADDRESS, tokenAbi, signer);
            const price = ethers.utils.parseUnits(ethPrice.current.value, CONFIG.USDT_DECIMAL);
            const transaction = await usdtContract.approve(CONFIG.ICO_CONTRACT_ADDRESS, price, { from: account });
            await transaction.wait();
            buyToken(price, signer);
        } catch (e) {
            setLoading(false);
        }

    }

    const buyToken = async (price, signer) => {
        try {
            const contract = new ethers.Contract(crowdsaleAddress, CROWDSALE_ABI, signer);
            console.log(bnbBalance)
            console.log(ethPrice.current.value)
            if (parseFloat(bnbBalance) < parseFloat(ethPrice.current.value)) {
                setLoading(false);
                alert('Insufficient Balance');
                return;
            }

            const transaction = await contract.buyTokens(account, price.toString());
            await transaction.wait();
            fetchAccountData();

            setLoading(false);
            alert('purchase done');
        } catch (e) {
            setLoading(false);
        }
    }

    const calReceivedToken = () => {
        setRecQty(parseFloat(ethPrice.current.value) * 200000)
    }

    const connectWallet = async () => {
        try {
            const web3modal = new Web3Modal({
                providerOptions
            });
            const instance = await web3modal.connect();
            const provider = new ethers.providers.Web3Provider(instance);
            updateProvider(provider)
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            addAccount({ id: address });
            const network = await provider.getNetwork();
            console.log(network)
            if (network.chainId !== CONFIG.NETWORK_ID) {
                setError(true)
                setErrMsg(`Contract is not deployed on current network. please choose ${CONFIG.NETWORK}`)
            } else {
                setError(false)
                setErrMsg('')
                fetchAccountData();
            }
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        fetchAccountData()
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', accounts => {
                // addAccount({ id: accounts[0] })
                connectWallet()
            })
            window.ethereum.on('chainChanged', chainId => {
                window.location.reload();
            })
        }
    }, [account]);

    return (
        <div className="my-28 flex items-center flex-col md:flex-row justify-between border border-white border-opacity-20  shadow-xl box-border">
            <div className="text-center w-full md:w-1/2 mb-4 md:mb-0">
                <div className='flex flex-col items-center'>
                    <div className='w-full'>
                        <h1 className="text-base sm:text-xl font-bold uppercase text-[#142b86]" >Initial Coin Offering</h1>
                        <h1 className="text-2xl sm:text-4xl font-bold uppercase text-black" >DYOPS TOKEN</h1>
                        <div className='w-4/5 md:w-3/5 mt-3 px-12 py-2 bg-[#142b86] text-white rounded-2xl font-bold mx-auto'>1 USDT = 200,000 DYOPS</div>
                        {account && (
                            <p className='text-sm text-black mt-4'>Your have purchased: {(tokenBalance) ? tokenBalance : 0} DYOPS</p>
                        )}
                        {/* <button className='mt-5 px-6 py-2 bg-[#142b86] text-white rounded font-bold hover:bg-[#007bff]' onClick={() => addToken()}>Add Token to your MetaMask</button> */}
                    </div>

                    <div className='mt-10 text-left '>
                        <h3 className=' uppercase text-sm font-semibold mb-2 text-black'>Instructions:</h3>
                        <ul className='text-sm list-outside list-disc mb-3'>
                            <li className='ml-4'>Connect your Polygon wallet</li>
                            <li className='ml-4'>Minimum purchase allowed: 500 USDT</li>
                            <li className='ml-4'>Maximum purchase allowed: 10000 USDT</li>
                        </ul>
                        <h3 className=' uppercase text-sm font-semibold mb-2 text-black'>Token Lock</h3>
                        <ul className='text-sm list-outside list-disc'>
                            <li className='ml-4'>25% lock 90 days</li>
                            <li className='ml-4'>25% lock 180 days</li>
                            <li className='ml-4'>50% lock 360 days</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="border p-10  border-white border-opacity-30 bg-[#142b86] text-white w-full md:w-1/2">
                <div className='mb-10'>
                    <div className='flex items-center justify-around space-x-2'>
                        <div className="polygon">
                            <div className='bg-white rounded-xl flex items-center min-w-[160px] justify-center'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="none" viewBox="0 0 1024 1024">
                                    <path fill="#8247E5" d="M681.469 402.456C669.189 395.312 653.224 395.312 639.716 402.456L543.928 457.228L478.842 492.949L383.055 547.721C370.774 554.865 354.81 554.865 341.301 547.721L265.162 504.856C252.882 497.712 244.286 484.614 244.286 470.326V385.786C244.286 371.498 251.654 358.4 265.162 351.256L340.073 309.581C352.353 302.437 368.318 302.437 381.827 309.581L456.737 351.256C469.018 358.4 477.614 371.498 477.614 385.786V440.558L542.7 403.647V348.874C542.7 334.586 535.332 321.488 521.824 314.344L383.055 235.758C370.774 228.614 354.81 228.614 341.301 235.758L200.076 314.344C186.567 321.488 179.199 334.586 179.199 348.874V507.237C179.199 521.526 186.567 534.623 200.076 541.767L341.301 620.354C353.582 627.498 369.546 627.498 383.055 620.354L478.842 566.772L543.928 529.86L639.716 476.279C651.996 469.135 667.961 469.135 681.469 476.279L756.38 517.954C768.66 525.098 777.257 538.195 777.257 552.484V637.023C777.257 651.312 769.888 664.409 756.38 671.554L681.469 714.419C669.189 721.563 653.224 721.563 639.716 714.419L564.805 672.744C552.525 665.6 543.928 652.502 543.928 638.214V583.442L478.842 620.354V675.126C478.842 689.414 486.21 702.512 499.719 709.656L640.944 788.242C653.224 795.386 669.189 795.386 682.697 788.242L823.922 709.656C836.203 702.512 844.799 689.414 844.799 675.126V516.763C844.799 502.474 837.431 489.377 823.922 482.233L681.469 402.456Z" />
                                </svg>
                                <p className='text-base font-medium ml-1'>Polygon</p>
                            </div>
                        </div>
                        <div className="connectBtn">
                            {account ? (
                                <div className="flex items-center flex-col">
                                    <button className="px-6 py-1 w-40 h-[35px] rounded-xl text-base bg-white text-black font-medium truncate hover:bg-[#142b86] hover:border hover:border-white hover:text-white focus:outline-none" onClick={() => delAccount()}>Disconnect</button>
                                </div>
                            ) : (
                                <button className="px-6 py-1 w-40 h-[35px] rounded-xl text-base bg-white text-black font-medium truncate hover:bg-[#142b86] hover:border hover:border-white hover:text-white focus:outline-none" onClick={() => connectWallet()}>Connect Wallet</button>
                            )}
                        </div>
                    </div>
                </div>
                <div>
                    {/* {account && (
                        <>
                            <p className='text-sm text-white'>Your DYOPS Balance: {(tokenBalance) ? tokenBalance : 0} </p>
                        </>
                    )} */}
                    <form onSubmit={approveUSDT}>
                        <div className="my-3">
                            <label className="text-base font-bold text-white">Amount USDT</label>
                            <input ref={ethPrice} type="text" className="w-full h-12 p-2 text-black text-xl focus:outline-none mt-1 bg-white border" required onChange={calReceivedToken} />
                            <div className='flex flex-row items-center justify-between space-x-2'>
                                <small>You will receive: {((recQty) ? recQty : 0) + ' ' + CONFIG.TOKEN_SYMBOL}</small>
                                <small>USDT: {(bnbBalance) ? bnbBalance : 0.00}</small>
                            </div>

                        </div>
                        <div className="my-3">
                            <label className="text-base font-bold text-white">Rate</label>
                            <input className="w-full h-12 p-2 text-xl focus:outline-none mt-1 border bg-white text-black" type="text" value={CONFIG.RATE + " USDT"} disabled />
                        </div>

                        <div className="mt-10">
                            <button disabled={loading} className="w-full py-2 px-6 uppercase bg-white font-bold text-black rounded-2xl hover:bg-[#142b86] border hover:border-white hover:text-white focus:outline-none">{loading ? 'Busy' : 'Buy'}</button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Presale;
