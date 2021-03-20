#!/usr/bin/env node

import { Secp256k1, Secp256k1Signature, sha256 } from '@cosmjs/crypto';
import { HdPath, Slip10RawIndex, stringToPath } from '@cosmjs/crypto';
import { fromBase64 } from '@cosmjs/encoding';
import {
  coins,
  GasPrice,
  makeCosmoshubPath,
  makeSignDoc,
  Msg,
  Secp256k1HdWallet,
  serializeSignDoc,
  SigningCosmosClient,
  StdFee,
} from '@cosmjs/launchpad';
import { LedgerSigner } from '@cosmjs/ledger-amino';
import {
  assertIsBroadcastTxSuccess,
  SigningStargateClient,
  SigningStargateClientOptions,
} from '@cosmjs/stargate';
import { sleep } from '@cosmjs/utils';
import Transport from '@ledgerhq/hw-transport';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';

const rpcEndpoint = 'http://0.0.0.0:26657';
const emoneyPrefix = 'emoney';

// A funded genesis address
const mnemonic =
  'play witness auto coast domain win tiny dress glare bamboo rent mule delay exact arctic vacuum laptop hidden siren sudden six tired fragile penalty';
const defaultChainId = 'localnet_reuse';
const defaultFee: StdFee = {
  amount: coins(100, 'ungm'),
  gas: '250',
};
const defaultSequence = '0';
const defaultAccountNumber = '42';
const defaultLedgerAddress = 'emoney13j6rftqlqrwv0ejkst4y2grq4swvrx5ad7gg45';
// const recipient = 'emoney15qdefkmwswysgg4qxgqpqr35k3m49pkxeyrqj5';
const defaultGasPrice = GasPrice.fromString('1ungm');

const hdPath = stringToPath("m/44'/118'/0'/0/0");

async function main() {
  await ledgerConn();

  const wallet = await Secp256k1HdWallet.fromMnemonic(
    mnemonic,
    hdPath,
    emoneyPrefix
  );

  // Get funded address
  const [firstAccount] = await wallet.getAccounts();
  console.log('sender:', firstAccount.address);

  const signingOptions: SigningStargateClientOptions = {
    gasPrice: defaultGasPrice,
    prefix: emoneyPrefix,
  };

  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    signingOptions
  );

  const amountToLedgerAddr = {
    denom: 'ungm',
    amount: '100',
  };

  const before = await client.getBalance(defaultLedgerAddress, 'ungm');
  if (before !== null) {
    console.log(`balance before ${before.amount}${before.denom}`);
  }
  const memo = 'Enjoy your NGM';

  /*************************************************
   * Send to the ledger address from another address
   *************************************************/
  const result = await client.sendTokens(
    firstAccount.address,
    defaultLedgerAddress,
    [amountToLedgerAddr],
    memo
  );
  assertIsBroadcastTxSuccess(result);
  const after = await client.getBalance(defaultLedgerAddress, 'ungm');
  if (after !== null) {
    console.log(`balance after ${after.amount}${after.denom}`);
  }

  /**********************************************
   * Send from ledger address to another address
   **********************************************/
  const amountFromLedgerAddr = {
    denom: 'ungm',
    amount: '10',
  };
}

async function ledgerConn() {
  // const transport = await TransportNodeHid.open("");
  const interactiveTimeout = 120_000;
  // const transportClass:any = await import("@ledgerhq/hw-transport-node-hid");
  console.log('****************');
  console.log(TransportNodeHid);
  console.log('****************');
  // const transport = await TransportNodeHid.open('');
  const transport = await TransportNodeHid.create(
    interactiveTimeout,
    interactiveTimeout
  );
  // const transport = await TransportNodeHid.create(
  //   interactiveTimeout,
  //   interactiveTimeout
  // );
  transport.setDebugMode(true);
  const signer = new LedgerSigner(transport, {
    testModeAllowed: true, // seems not used in the code base
    hdPaths: [hdPath],
  });

  const accounts = await signer.getAccounts();
  console.log(`${accounts.length}, ${accounts[0]}`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
