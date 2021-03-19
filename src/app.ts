#!/usr/bin/env node

export const mnemonic =
  "play witness auto coast domain win tiny dress glare bamboo rent mule delay exact arctic vacuum laptop hidden siren sudden six tired fragile penalty";

  import { stringToPath } from "@cosmjs/crypto";
  import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
  
  export async function main() {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
      mnemonic,
      stringToPath("m/44'/118'/0'/0/0"),
      "emoney"
    );
    const [firstAccount] = await wallet.getAccounts();
    console.log(firstAccount);
  }

  main().then(
    () => process.exit(0),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
  