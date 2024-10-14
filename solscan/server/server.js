import express from 'express';
import cors from 'cors';

import * as anchor from '@coral-xyz/anchor';
import * as solanaWeb3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import base58 from "bs58";
import idl from "./idl.json" assert { type: "json" };

const app = express();

app.use(express.json({
    limit: '50mb'
}));
app.use(cors());

app.get('/', (_, res) => {
    res.send('Hello from Solscan server');
})

app.post('/mint-token', async (req, res) => {
    try {
        const { private_key, rpc } = req.body;
        const admin_keypair = base58.decode(private_key);
        const my_account = anchor.web3.Keypair.fromSecretKey(admin_keypair);
        const my_wallet = new anchor.Wallet(my_account);
        const connection = new solanaWeb3.Connection(rpc, 'confirmed');
        const provider = new anchor.AnchorProvider(connection, my_wallet, anchor.AnchorProvider.defaultOptions());
        anchor.setProvider(provider);
        const program = new anchor.Program(idl, provider);
        const mint_account = anchor.web3.Keypair.generate();
        const metadata = {
            name: 'Solana Gold',
            symbol: 'GOLDSOL',
            uri: 'https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json',
        };
        const tx = await program
            .methods
            .createToken(metadata.name, metadata.symbol, metadata.uri)
            .accounts({
                mintAccount: mint_account.publicKey,
            })
            .signers([mint_account])
            .rpc();
        console.log(`Create minter success with tx: ${tx}`);
        console.log(`Minter address: ${mint_account.publicKey.toBase58()}`);
        const associatedTokenAccountAddress = splToken.getAssociatedTokenAddressSync(
            mint_account.publicKey,
            my_wallet.publicKey,
        );
        const { BN } = anchor.default;
        const amount = new BN(1);
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
            .rpc();
        console.log(`Mint token success with tx: ${tx}`);
        res.status(200).send({
            tx: tx,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: error
        });
    }
})

app.listen(8080, () => {
    console.log('Server is running on port 8080');
})
