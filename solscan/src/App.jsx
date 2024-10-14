import React from 'react';
import axios from 'axios';
import { Buffer } from 'buffer';

import * as anchor from '@coral-xyz/anchor';
import base58 from "bs58";

const defaultAccountData = {
  lamports: 0,
};
const rpc = 'https://api.devnet.solana.com';

function App() {

  const [loading, setLoading] = React.useState(false);
  const [accountAddress, setAccountAddress] = React.useState(null);
  const [accountPrivateKey, setAccountPrivateKey] = React.useState(null);
  const [accountAddressTemp, setAccountAddressTemp] = React.useState(null);
  const [accountData, setAccountData] = React.useState(defaultAccountData);
  const [accountTokenData, setAccountTokenData] = React.useState([]);

  const fetchAccountData = async () => {
    await axios.post(rpc, {
      method: "getAccountInfo",
      jsonrpc: "2.0",
      params: [
        accountAddress,
        {
          encoding: "jsonParsed"
        }
      ],
      id: 1
    })
      .then(res => setAccountData(res.data?.result?.value))
      .catch(err => console.log(err))
  }

  const fetchAccountTokenData = async () => {
    await axios.post(rpc, {
      method: "getTokenAccountsByOwner",
      jsonrpc: "2.0",
      params: [
        accountAddress,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        {
          encoding: "jsonParsed",
          commitment: "recent"
        }
      ],
      id: 1
    })
      .then(res => setAccountTokenData(res.data?.result?.value))
      .catch(err => console.log(err))
  }

  const fetchData = async () => {
    setLoading(true);
    await fetchAccountData();
    await fetchAccountTokenData();
    setLoading(false);
  }

  React.useEffect(() => {
    if (accountAddress) fetchData();
  }, [accountAddress])

  const rounded = (number) => {
    if (isNaN(Number(number))) return 0;
    else return (number / 1000000000).toFixed(2);
  }

  const handleUploadPrivateKey = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonSecretKey = JSON.parse(event.target.result);
          const bufferSecretKey = Buffer.from(jsonSecretKey);
          const myAccount = anchor.web3.Keypair.fromSecretKey(bufferSecretKey);
          if(myAccount.publicKey.toString() !== accountAddress) {
            alert("The private key does not match the account address.");
            return;
          }
          setAccountPrivateKey(base58.encode(myAccount.secretKey));
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      };
      reader.readAsText(file);
    } else {
      console.error("Please upload a valid JSON file.");
    }
  };

  const mintToken = async () => {
    setLoading(true);
    await axios.post('http://localhost:8080/mint-token', {
      rpc: rpc,
      private_key: accountPrivateKey,
    })
    .then(res => alert(`Minting token successful with tx: ${res.data.tx}`))
    .catch(err => alert(`Minting token failed: ${err.response.data.error?.transactionMessage}`))
    fetchData();
  }

  return (
    accountAddress ?
      <>
        <div>
          <div style={{
            display: "flex",
            gap: "1rem",
          }}>
            <button onClick={() => {
              setAccountAddress(null);
              setAccountPrivateKey(null);
            }}>Back</button>
            <button onClick={() => fetchData()}>Refresh</button>
          </div>
          {loading ? <p>Fetching Account Data...</p> :
            <>
              <div>Address: {accountAddress}</div>
              <div>Solana Balance: {rounded(accountData?.lamports)}</div>
              <div>
                <div>Token(s): {accountTokenData?.length}</div>
                <div style={{
                  margin: "1rem"
                }}>
                  {accountTokenData && accountTokenData.map((token, index) => {
                    return (
                      <div key={index} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "1rem",
                        padding: "0.5rem",
                        borderBottom: "1px solid #ccc"
                      }}>
                        <div style={{
                          width: "50%",
                        }}>{index + 1}. Address: {token.account.data.parsed.info.mint}</div>
                        <div style={{
                          width: "30%",
                        }}>Amount: {rounded(token.account.data.parsed.info.tokenAmount.amount)}</div>
                        <button>Action</button>
                      </div>
                    )
                  })}
                </div>
                <div>
                  {accountPrivateKey ? (
                    <>
                      <p>Private Key: {accountPrivateKey}</p>
                      <button onClick={() => setAccountPrivateKey(null)}>Remove</button>
                    </>
                  ) : (
                    <>
                      <p>No Private Key</p>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleUploadPrivateKey}
                        placeholder="Upload your private key JSON file"
                      />
                    </>
                  )}
                </div>
                {accountPrivateKey && <button onClick={() => mintToken()}>Mint More</button>}
              </div>
            </>}
        </div>
      </> :
      <div style={{
        display: "flex",
        gap: "1rem",
      }}>
        <input onChange={(e) => setAccountAddressTemp(e.target.value)} style={{
          width: "300px",
        }}></input>
        <button onClick={() => {
          setAccountAddress(accountAddressTemp);
        }}>Search</button>
      </div>
  )
}

export default App
