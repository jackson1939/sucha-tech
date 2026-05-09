use anchor_lang::prelude::*;

declare_id!("VBroKERprogramId1111111111111111111111111111");

/// Vibe Broker — RecordReceipt
///
/// Programa mínimo para registrar un recibo on-chain cada vez que
/// el backend propaga una transacción. Permite trazabilidad auditable
/// sin custodia de fondos.
#[program]
pub mod vibe_broker {
    use super::*;

    /// Crea un nuevo recibo de operación on-chain.
    pub fn record_receipt(
        ctx: Context<RecordReceiptCtx>,
        params: ReceiptParams,
    ) -> Result<()> {
        let receipt = &mut ctx.accounts.receipt;
        let clock = Clock::get()?;

        // Validaciones básicas
        require!(params.amount_lamports > 0, VibeBrokerError::ZeroAmount);
        require!(params.simulation_id.len() <= 64, VibeBrokerError::SimIdTooLong);
        require!(params.token_from.len() <= 10, VibeBrokerError::TokenNameTooLong);
        require!(params.token_to.len()   <= 10, VibeBrokerError::TokenNameTooLong);

        receipt.authority       = ctx.accounts.authority.key();
        receipt.simulation_id   = params.simulation_id;
        receipt.amount_lamports = params.amount_lamports;
        receipt.token_from      = params.token_from;
        receipt.token_to        = params.token_to;
        receipt.confirmation_type = params.confirmation_type;
        receipt.timestamp       = clock.unix_timestamp;
        receipt.bump            = ctx.bumps.receipt;

        emit!(ReceiptRecorded {
            authority:     receipt.authority,
            simulation_id: receipt.simulation_id.clone(),
            amount:        receipt.amount_lamports,
            timestamp:     receipt.timestamp,
        });

        msg!(
            "Recibo registrado | sim={} amount={} ts={}",
            receipt.simulation_id,
            receipt.amount_lamports,
            receipt.timestamp,
        );

        Ok(())
    }

    /// Cierra la cuenta de recibo y devuelve el rent al authority.
    pub fn close_receipt(_ctx: Context<CloseReceiptCtx>) -> Result<()> {
        msg!("Recibo cerrado y rent devuelto");
        Ok(())
    }
}

// ─── Parámetros ────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ReceiptParams {
    pub simulation_id:     String,   // max 64 chars
    pub amount_lamports:   u64,
    pub token_from:        String,   // max 10 chars, ej. "USDC"
    pub token_to:          String,   // max 10 chars, ej. "SOL"
    pub confirmation_type: u8,       // 0 = voice, 1 = double
}

// ─── Cuentas ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(params: ReceiptParams)]
pub struct RecordReceiptCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer  = authority,
        space  = Receipt::LEN,
        seeds  = [b"receipt", authority.key().as_ref(), params.simulation_id.as_bytes()],
        bump,
    )]
    pub receipt: Account<'info, Receipt>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseReceiptCtx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        close  = authority,
        has_one = authority,
    )]
    pub receipt: Account<'info, Receipt>,
}

// ─── Estado on-chain ───────────────────────────────────────────────────────

#[account]
pub struct Receipt {
    pub authority:        Pubkey,  // 32
    pub simulation_id:    String,  // 4 + 64
    pub amount_lamports:  u64,     // 8
    pub token_from:       String,  // 4 + 10
    pub token_to:         String,  // 4 + 10
    pub confirmation_type: u8,     // 1
    pub timestamp:        i64,     // 8
    pub bump:             u8,      // 1
}

impl Receipt {
    // discriminator(8) + authority(32) + sim_id(4+64) + amount(8)
    // + token_from(4+10) + token_to(4+10) + conf_type(1) + ts(8) + bump(1)
    pub const LEN: usize = 8 + 32 + (4 + 64) + 8 + (4 + 10) + (4 + 10) + 1 + 8 + 1;
}

// ─── Eventos ───────────────────────────────────────────────────────────────

#[event]
pub struct ReceiptRecorded {
    pub authority:     Pubkey,
    pub simulation_id: String,
    pub amount:        u64,
    pub timestamp:     i64,
}

// ─── Errores ───────────────────────────────────────────────────────────────

#[error_code]
pub enum VibeBrokerError {
    #[msg("El monto no puede ser cero")]
    ZeroAmount,
    #[msg("simulation_id excede 64 caracteres")]
    SimIdTooLong,
    #[msg("Nombre de token excede 10 caracteres")]
    TokenNameTooLong,
}
