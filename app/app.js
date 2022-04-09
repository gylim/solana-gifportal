import React, {useEffect, useState} from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import idl from './idl.json';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import kp from './keypair.json';

// Constants
const TWITTER_HANDLE = 'bgylim';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const {SystemProgram, Keypair} = web3;
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts = {preflightCommitment: "processed"}

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana && solana.isPhantom) {
        console.log('Phantom wallet found');
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log('Connected with Public Key:', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
      } else {
        alert('Solana wallet not found. Get Phantom!')
      }
      } catch (error) {
        console.log(error);
      }
    }

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  }

  const onInputChange = (event) => {
    const {value} = event.target;
    setInputValue(value);
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
  	return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("pinged");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created new BaseAccount w/ address: ", baseAccount.publicKey.toString());
      await getGifList();
    } catch (err) {
      console.log("Error creating BaseAccount: ", err)
    }
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  }

  const vote = async (url) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.vote(url, {
        accounts: {baseAccount: baseAccount.publicKey}
      });
      console.log("Succesfully voted for", url)
      await getGifList();
    } catch (error) {
      console.log("Error voting:", error)
    }
  }

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}>Connect Solana Wallet</button>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
      return(
        <div className="connected-container">
          <form onSubmit={(event) => {
            event.preventDefault();
            sendGif();
            }}>
            <input type="text" placeholder="Enter gif link!" 
              value={inputValue} onChange={onInputChange}/>
            <button type="submit" className="cta-button submit-gif-button">Submit</button>
          </form>
          <div className="gif-grid">
            {gifList.map((item, idx) => (
              <div className="gif-item" key={idx}>
                <img src={item.gifLink} alt={item.gifLink} />
                <p className="submitter">Submitter: {item.userAddress.toString().substring(0,3)+"..."+item.userAddress.toString().slice(-4)}</p>
                <span className="voteline"><p className="submitter">Votes: {item.votes.toString()}</p>
                <button onClick={() => vote(item.gifLink)} className="vote">+1</button></span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  };

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)
      console.log("Got account", account)
      setGifList(account.gifList)
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...')
      getGifList()
    }
  }, [walletAddress]);
  
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 Doge GIF Portal</p>
          <p className="sub-text">
            All hail King Doge! ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;