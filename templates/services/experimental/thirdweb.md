---
module: thirdweb
category: experimental
description: "[EXPERIMENTAL] Thirdweb Web3 SDK — wallet connect, token gating, NFT minting, and on-chain credential issuance. Use when issuing verifiable certificates or building token-gated content access."
install: npm
---

# Module: thirdweb (EXPERIMENTAL)

Thirdweb provides Web3 primitives: wallet connection, ERC-20/721/1155 contracts, token gating, and on-chain credential issuance. Relevant if you want to issue verifiable certificates of completion (GTLI) or gate premium content behind token ownership.

**Experimental status:** Web3 UX is a barrier for most users. Wallet setup is a significant friction point for non-technical audiences. Only use if the use case genuinely requires on-chain verification (e.g., portable certificates a learner owns even if GTLI shuts down).

## Potential use cases in your projects

- **GTLI**: Issue course completion certificates as on-chain credentials (soulbound NFTs)
- **GTLI**: Token-gate premium content (holders of a "CEFR B2 token" access advanced modules)
- **ernest**: On-chain leadership assessment scores as portable credentials

## Install

```bash
npm install thirdweb
```

## Scaffold

**lib/web3/client.ts:**
```ts
import { createThirdwebClient } from "thirdweb";

export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});
```

**lib/web3/chain.ts:**
```ts
import { base, baseSepolia } from "thirdweb/chains";

export const chain =
  process.env.NODE_ENV === "production" ? base : baseSepolia;
```

**components/web3/ConnectWallet.tsx:**
```tsx
"use client";
import { ConnectButton } from "thirdweb/react";
import { thirdwebClient } from "@/lib/web3/client";
import { chain } from "@/lib/web3/chain";

export function ConnectWallet() {
  return (
    <ConnectButton
      client={thirdwebClient}
      chain={chain}
      connectModal={{ size: "compact" }}
    />
  );
}
```

**lib/web3/certificate.ts — issue soulbound certificate NFT:**
```ts
import { getContract, sendTransaction, prepareContractCall } from "thirdweb";
import { thirdwebClient } from "./client";
import { chain } from "./chain";

export async function issueCertificate({
  recipientAddress,
  courseId,
  walletAccount,
}: {
  recipientAddress: string;
  courseId: string;
  walletAccount: unknown;
}) {
  const contract = getContract({
    client: thirdwebClient,
    chain,
    address: process.env.CERTIFICATE_CONTRACT_ADDRESS!,
  });

  const transaction = prepareContractCall({
    contract,
    method: "function mintCertificate(address to, string courseId)",
    params: [recipientAddress, courseId],
  });

  return sendTransaction({ transaction, account: walletAccount as any });
}
```

**providers/ThirdwebProvider.tsx:**
```tsx
"use client";
import { ThirdwebProvider } from "thirdweb/react";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
}
```

## .env.example additions

```bash
# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...
CERTIFICATE_CONTRACT_ADDRESS=0x...
```
