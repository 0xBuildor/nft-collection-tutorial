import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import {providers, Contract, utils} from "ethers";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const [loading, setLoading] = useState(false); 
  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      // Get an instance of your NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider
      );
      const numTokenIds = await nftContract.tokenIds();
      setNumTokensMinted(numTokenIds.toString());
    } catch (error) {
      console.error(error)
    }
  }

  const presaleMint = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        signer
      );

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();

      window.alert("You successfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const publicMint = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        signer
      );

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();

      window.alert("You successfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const getOwner = async () => {
    try {
      
      const signer = await getProviderOrSigner(true);

      // Get an instance of your NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        signer
      );
      
      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
    
  }

  const startPresale = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      // Get an instance of your NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider
      );
      
      // This will return a BigNumber because presaleEnded is a uint256
      // This will return a timestamp in seconds
      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;
      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );

      setPresaleEnded(hasPresaleEnded);

    } catch (error) {
      console.error(error);
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      // Get an instance of your NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider
      );

      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true); // Update 'walletconnected'to be true
    } catch (error) {
      console.error(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // Need to gain access to the provider/signer from Metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider); 
    
    
    // If the user is not connected to Goerli, tell them to switch
    const {chainId} = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please switch to the Goerli network");
      throw new Error("Incorrect network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  }

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    // Track in real time the number of minted NFTs
    setInterval(async () => {
      await getNumMintedTokens();
    }, 5 * 1000);

    // Track in real time the status of presale (started, ended, etc..)
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }

    }, 5 * 1000);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      
      onPageLoad();
    }
  }, [])


  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your Wallet
        </button>
      );
    }

    if (loading) {
      return (
        <span className={styles.description}>Loading...</span>
      )
    }

    if (isOwner && !presaleStarted) {
      // render a button to start the presale
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      // just say that presale hasnt started yet
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. Come back later!
          </span>
        </div>
      )
    }

    if (presaleStarted && !presaleEnded) {
      // allow users to mint in presale
      // they need to be whitelist for this to work
      return (
       <div>
          <span className={styles.description}>
            Presale has started! If your address is whitelisted, you can mint a CryptoDev!
          </span>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🖼
          </button>
        </div> 
      );
    }

    if (presaleEnded) {
      // allow users to take part in public sale
      return (
        <div>
          <span className={styles.description}>
            Presale has ended. You can mint a CryptoDev in public sale, if any remain. 
          </span>
          <button className={styles.button} onClick={publicMint}>
            Public Mint 🖼
          </button>
        </div> 
      );
    }
  }


  return (
  <div>
    <Head>
      <title>Crypto Devs NFT</title>
    </Head>

    <div className={styles.main}>
      <div>

        <h1 className={styles.title}>Welcomme to CryptoDevs NFT</h1>
        <div className={styles.description}>
          CryptoDevs NFT is a test NFT collection for Learn Web3 DAO
        </div>
        <div className={styles.description}>
          {numTokensMinted}/20 have been minted already!
        </div>
        {renderBody()}
      </div>
    <img className={styles.image} src="/cryptodevs/0.svg" />
    </div>

    <footer className={styles.footer}>
    Made with &#10084; by Crypto Devs
    </footer>
    
  </div>
  );
}
