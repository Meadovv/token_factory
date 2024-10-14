use anchor_lang::prelude::*;
pub mod instructions;
use instructions::*;
declare_id!("2iZgZARdqbmP5byvsZoZo1pmFdJ2zRAYRsHnUN24gCVH");
#[program]
pub mod spl_token_minter {
    use super::*;

    pub fn create_token(
        ctx: Context<CreateTokenContext>,
        token_name: String,
        token_symbol: String,
        token_uri: String,
    ) -> Result<()> {
        create::create_token(ctx, token_name, token_symbol, token_uri)
    }

    pub fn mint_token(ctx: Context<MintTokenContext>, amount: u64) -> Result<()> {
        mint::mint_token(ctx, amount)
    }
}


