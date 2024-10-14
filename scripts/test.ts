import * as anchor from '@coral-xyz/anchor';
import * as solanaWeb3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import base58 from "bs58";
const idl = require('../target/idl/spl_token_minter.json');

async function main() {
  // Connect to my wallet
  const private_key = "9LA3AQoMMB8ttoAeuN5AX5q2iGbKcM8obz6Tr5tUvRWj8RGhdSivpXjXh2faVRn4Cob2MtaZF26uzpesz3DuZCv";
  const admin_keypair = base58.decode(private_key);
  const my_account = anchor.web3.Keypair.fromSecretKey(admin_keypair);
  const my_wallet = new anchor.Wallet(my_account);

  // Connect to the network
  const connection = new solanaWeb3.Connection('http://127.0.0.1:8899', 'confirmed');
  const provider = new anchor.AnchorProvider(connection, my_wallet, anchor.AnchorProvider.defaultOptions());
  anchor.setProvider(provider);
  const program: anchor.Program = new anchor.Program(idl, provider);

  // Do something

  const mint_account = anchor.web3.Keypair.generate();
  const metadata = {
    name: 'Solana Gold',
    symbol: 'GOLDSOL',
    uri: 'https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json',
  };
  await program
    .methods
    .createToken(metadata.name, metadata.symbol, metadata.uri)
    .accounts({
      mintAccount: mint_account.publicKey,
    })
    .signers([mint_account])
    .rpc()
    .then(tx => {
      console.log("Transaction signature", tx);
      console.log("Mint account", mint_account.publicKey.toBase58());
    })
    .catch(err => console.log(err));

  const associatedTokenAccountAddress = splToken.getAssociatedTokenAddressSync(
    mint_account.publicKey,
    my_wallet.publicKey,
  );

  const amount = new anchor.BN(1000);
  await program
    .methods
    .mintToken(amount)
    .accounts({
      mintAuthority: my_wallet.publicKey,
      recipient: my_wallet.publicKey,
      mintAccount: mint_account.publicKey,
      associatedTokenAccount: associatedTokenAccountAddress,
    })
    .signers([])
    .rpc()
    .then(tx => {
      console.log('Success!');
      console.log(`Associated Token Account Address: ${associatedTokenAccountAddress}`);
      console.log(`Transaction Signature: ${tx}`);
    })
    .catch(err => console.log(err))
}

main().then(
  () => process.exit(),
  err => {
    console.log(err);
    process.exit(-1);
  },
);